import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL ?? '*' } })
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private jwtService: JwtService) {}

  /**
   * Clients used to pick which user's room to join by sending any userId,
   * so anyone could listen to anyone else's notifications. Now the room is
   * derived from the verified access token and nothing else.
   */
  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, { secret: process.env.JWT_SECRET });
      if (payload.twoFaPending || !payload.role) {
        client.disconnect();
        return;
      }
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  push(userId: string, notification: unknown) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }
}
