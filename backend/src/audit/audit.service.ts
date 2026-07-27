import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async listRecent(limit = 100) {
    const logs = await this.prisma.adminAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const adminIds = [...new Set(logs.map((l) => l.adminId))];
    const admins = await this.prisma.user.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, email: true },
    });
    const emailById = new Map(admins.map((a) => [a.id, a.email]));

    return logs.map((l) => ({ ...l, adminEmail: emailById.get(l.adminId) ?? l.adminId }));
  }
}
