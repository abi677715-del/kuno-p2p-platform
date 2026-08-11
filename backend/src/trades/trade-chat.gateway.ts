import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { TradesService } from './trades.service';

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL ?? '*' } })
export class TradeChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private tradesService: TradesService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, { secret: process.env.JWT_SECRET });
      client.data.userId = payload.sub;
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('joinTrade')
  async handleJoin(@ConnectedSocket() client: Socket, @MessageBody() tradeId: string) {
    if (!client.data.userId) return;
    const trade = await this.tradesService.findById(tradeId).catch(() => null);
    if (!trade || (trade.buyerId !== client.data.userId && trade.sellerId !== client.data.userId)) return;
    client.join(tradeId);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tradeId: string; message: string; attachmentUrl?: string },
  ) {
    if (!client.data.userId) return;
    const saved = await this.tradesService.sendMessage(client.data.userId, data.tradeId, {
      message: data.message,
      attachmentUrl: data.attachmentUrl,
    });
    this.server.to(data.tradeId).emit('newMessage', saved);
  }
}
