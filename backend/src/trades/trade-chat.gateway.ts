import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TradesService } from './trades.service';

/**
 * Realtime layer for the Trade Room. REST endpoints in TradesController remain
 * the source of truth (and work fine without a socket connection); this gateway
 * just pushes new messages to anyone in the same trade's room instantly.
 */
@WebSocketGateway({ cors: { origin: '*' } })
export class TradeChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private tradesService: TradesService) {}

  @SubscribeMessage('joinTrade')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() tradeId: string) {
    client.join(tradeId);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tradeId: string; userId: string; message: string; attachmentUrl?: string },
  ) {
    const saved = await this.tradesService.sendMessage(data.userId, data.tradeId, {
      message: data.message,
      attachmentUrl: data.attachmentUrl,
    });
    this.server.to(data.tradeId).emit('newMessage', saved);
  }
}
