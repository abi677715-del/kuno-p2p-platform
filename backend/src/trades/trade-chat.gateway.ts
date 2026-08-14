diff --git a/backend/src/trades/trade-chat.gateway.ts b/backend/src/trades/trade-chat.gateway.ts
index a4c3f6a..7e5bdb3 100644
--- a/backend/src/trades/trade-chat.gateway.ts
+++ b/backend/src/trades/trade-chat.gateway.ts
@@ -1,3 +1,4 @@
+import { forwardRef, Inject } from '@nestjs/common';
 import {
   ConnectedSocket,
   MessageBody,
@@ -16,10 +17,16 @@ export class TradeChatGateway implements OnGatewayConnection {
   server: Server;
 
   constructor(
+    @Inject(forwardRef(() => TradesService))
     private tradesService: TradesService,
     private jwtService: JwtService,
   ) {}
 
+  /** Pushes the latest trade state to whoever's in the trade's room — called by TradesService whenever a trade's status changes. */
+  emitTradeUpdate(tradeId: string, trade: unknown) {
+    this.server?.to(tradeId).emit('tradeUpdated', trade);
+  }
+
   async handleConnection(client: Socket) {
     const token = client.handshake.auth?.token as string | undefined;
     if (!token) {
diff --git a/backend/src/trades/trades.service.ts b/backend/src/trades/trades.service.ts
index 70e19df..0778751 100644
--- a/backend/src/trades/trades.service.ts
+++ b/backend/src/trades/trades.service.ts
@@ -1,4 +1,4 @@
-import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
+import { BadRequestException, ForbiddenException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
 import { authenticator } from 'otplib';
 import { PrismaService } from '../common/prisma.service';
 import { WalletService } from '../wallet/wallet.service';
@@ -17,6 +17,7 @@ import { RateTradeDto } from './dto/rate-trade.dto';
 import { tierFor, dailyLimitFor, monthlyLimitFor } from '../common/trader-tier';
 import { TRADE_TIMEOUT_MINUTES } from './trade-timeout.constants';
 import { generateTradeCode } from './trade-code';
+import { TradeChatGateway } from './trade-chat.gateway';
 
 const REFERRAL_FEE_SHARE_PERCENT = parseFloat(process.env.REFERRAL_FEE_SHARE_PERCENT ?? '20');
 const DAY_MS = 24 * 60 * 60 * 1000;
@@ -32,8 +33,16 @@ export class TradesService {
     private notificationsService: NotificationsService,
     private relationsService: RelationsService,
     private usersService: UsersService,
+    @Inject(forwardRef(() => TradeChatGateway))
+    private chatGateway: TradeChatGateway,
   ) {}
 
+  /** Pushes the freshly-computed trade state to anyone watching this trade's room, so both sides see status changes live instead of waiting on a poll. */
+  private async broadcastTradeUpdate(tradeId: string) {
+    const trade = await this.getOne(tradeId).catch(() => null);
+    if (trade) this.chatGateway.emitTradeUpdate(tradeId, trade);
+  }
+
   /**
    * Starts a trade against an ad. Whoever holds the USDT (the "seller" role)
    * has it locked into escrow immediately — that's what makes the trade safe
@@ -236,6 +245,7 @@ export class TradesService {
       { tradeId, message },
       { subject: 'Buyer marked payment sent', message, tradeId },
     );
+    await this.broadcastTradeUpdate(tradeId);
     return updated;
   }
 
@@ -287,6 +297,7 @@ export class TradesService {
       { subject: 'Trade complete', message, tradeId },
     );
     await this.creditReferralBonuses(trade, releaseResult.feeAmount);
+    await this.broadcastTradeUpdate(tradeId);
     return updated;
   }
 
@@ -375,6 +386,7 @@ export class TradesService {
       { tradeId, message },
       { subject: 'Trade cancelled', message, tradeId },
     );
+    await this.broadcastTradeUpdate(tradeId);
     return updated;
   }
 
@@ -401,6 +413,7 @@ export class TradesService {
       { subject: 'Dispute opened on your trade', message, tradeId },
     );
 
+    await this.broadcastTradeUpdate(tradeId);
     return updated;
   }
 
@@ -461,6 +474,7 @@ export class TradesService {
         this.notificationsService.create(trade.buyerId, 'TRADE_CANCELLED', { tradeId: trade.id, message }, { subject: 'Trade cancelled', message, tradeId: trade.id }),
         this.notificationsService.create(trade.sellerId, 'TRADE_CANCELLED', { tradeId: trade.id, message }, { subject: 'Trade cancelled', message, tradeId: trade.id }),
       ]);
+      await this.broadcastTradeUpdate(trade.id);
     }
     return stale.length;
   }
@@ -492,6 +506,7 @@ export class TradesService {
         this.notificationsService.create(trade.buyerId, 'DISPUTE_OPENED', { tradeId: trade.id, message }, { subject: 'Trade escalated to support', message, tradeId: trade.id }),
         this.notificationsService.create(trade.sellerId, 'DISPUTE_OPENED', { tradeId: trade.id, message }, { subject: 'Trade escalated to support', message, tradeId: trade.id }),
       ]);
+      await this.broadcastTradeUpdate(trade.id);
     }
     return stale.length;
   }
@@ -605,6 +620,7 @@ export class TradesService {
       ),
     ]);
 
+    await this.broadcastTradeUpdate(trade.id);
     return updatedDispute;
   }
 }
diff --git a/frontend/app/trades/[id]/page.tsx b/frontend/app/trades/[id]/page.tsx
index a642cd2..4310dfc 100644
--- a/frontend/app/trades/[id]/page.tsx
+++ b/frontend/app/trades/[id]/page.tsx
@@ -7,7 +7,9 @@ import { apiFetch, API_URL } from '@/lib/api';
 import { displayName } from '@/lib/displayName';
 import { formatAmount } from '@/lib/format';
 
-const POLL_MS = 4000;
+// Trade status pushes over the socket ('tradeUpdated') are the primary way this
+// page stays fresh — this poll is just a safety net for when the socket is down.
+const POLL_MS = 15_000;
 
 const STATUS_LABEL: Record<string, string> = {
   PENDING: 'Pending',
@@ -87,6 +89,7 @@ export default function TradeRoomPage() {
   const [busy, setBusy] = useState(false);
   const [confirmCode, setConfirmCode] = useState('');
   const [showDisputeForm, setShowDisputeForm] = useState(false);
+  const [live, setLive] = useState(false);
 
   async function loadTrade() {
     try {
@@ -102,11 +105,31 @@ export default function TradeRoomPage() {
     apiFetch(`/trades/${tradeId}/read`, { method: 'POST' }).catch(() => {});
   }, [tradeId]);
 
+  // Fallback poll — covers the gap while the socket below is (re)connecting.
   useEffect(() => {
     const interval = setInterval(loadTrade, POLL_MS);
     return () => clearInterval(interval);
   }, [tradeId]);
 
+  // Live status updates: the backend pushes 'tradeUpdated' to this trade's room
+  // whenever its status changes (buyer/seller action, dispute, or auto-timeout).
+  useEffect(() => {
+    const token = localStorage.getItem('accessToken');
+    if (!token) return;
+    const socket = io(API_URL, { auth: { token } });
+
+    socket.on('connect', () => {
+      setLive(true);
+      socket.emit('joinTrade', tradeId);
+    });
+    socket.on('disconnect', () => setLive(false));
+    socket.on('tradeUpdated', (updated: any) => setTrade(updated));
+
+    return () => {
+      socket.disconnect();
+    };
+  }, [tradeId]);
+
   if (!trade) return <main className="min-h-screen bg-ink px-6 py-10 text-muted">{error || 'Loading…'}</main>;
 
   const isBuyer = me?.id === trade.buyerId;
@@ -146,8 +169,14 @@ export default function TradeRoomPage() {
         <div className="bg-surface border border-white/10 rounded-xl p-6">
           <div className="flex items-center justify-between flex-wrap gap-2">
             <h1 className="font-display font-bold text-xl text-paper">Trade room</h1>
-            <span className={`text-sm font-mono uppercase ${STATUS_COLOR[trade.status] ?? 'text-muted'}`}>
-              {STATUS_LABEL[trade.status] ?? trade.status}
+            <span className="flex items-center gap-1.5">
+              <span
+                className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-teal' : 'bg-white/20'}`}
+                title={live ? 'Live' : 'Reconnecting…'}
+              />
+              <span className={`text-sm font-mono uppercase ${STATUS_COLOR[trade.status] ?? 'text-muted'}`}>
+                {STATUS_LABEL[trade.status] ?? trade.status}
+              </span>
             </span>
           </div>
