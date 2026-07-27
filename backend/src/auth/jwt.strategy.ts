import { Injectable } from '@nestjs/common';
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

  async validate(payload: { sub: string; email: string; role: string }) {
    // Fire-and-forget presence tracking — powers the "online" indicator on
    // marketplace ads. Not awaited so it never adds latency to a real request.
    this.prisma.user.update({ where: { id: payload.sub }, data: { lastSeenAt: new Date() } }).catch(() => {});
    // Attached to req.user in any route protected by JwtAuthGuard
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
