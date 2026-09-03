import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { getAllowedOrigins } from '../common/cors';

@WebSocketGateway({ cors: { origin: getAllowedOrigins() } })
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinUser')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() userId: string) {
    client.join(`user:${userId}`);
  }

  push(userId: string, notification: unknown) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }
}
