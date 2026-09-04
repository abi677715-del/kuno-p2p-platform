import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  async validate(payload: { sub: string; email: string; role: string; iat: number }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { sessionInvalidatedAt: true },
    });
    // "Log out of all devices" sets this — any token minted before that
    // moment (including the one on this request) stops working immediately.
    // JWT `iat` is second-precision, so round the invalidation timestamp
    // down to the second too — otherwise a token freshly issued in the same
    // second as the invalidation could be incorrectly rejected.
    if (user?.sessionInvalidatedAt) {
      const invalidatedAtSeconds = Math.floor(user.sessionInvalidatedAt.getTime() / 1000);
      if (payload.iat < invalidatedAtSeconds) {
        throw new UnauthorizedException('Session was logged out remotely, please log in again');
      }
    }

    // Fire-and-forget presence tracking — powers the "online" indicator on
    // marketplace ads. Not awaited so it never adds latency to a real request.
    this.prisma.user.update({ where: { id: payload.sub }, data: { lastSeenAt: new Date() } }).catch(() => {});
    // Attached to req.user in any route protected by JwtAuthGuard
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
