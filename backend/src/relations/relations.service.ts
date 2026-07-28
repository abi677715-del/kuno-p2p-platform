import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RelationType } from '@prisma/client';
import { formatBid } from '../common/bid';

@Injectable()
export class RelationsService {
  constructor(private prisma: PrismaService) {}

  async setRelation(userId: string, targetUserId: string, type: RelationType) {
    if (userId === targetUserId) {
      throw new BadRequestException('You cannot do this to your own account');
    }
    return this.prisma.userRelation.upsert({
      where: { userId_targetUserId: { userId, targetUserId } },
      update: { type },
      create: { userId, targetUserId, type },
    });
  }

  async removeRelation(userId: string, targetUserId: string, type: RelationType) {
    await this.prisma.userRelation.deleteMany({ where: { userId, targetUserId, type } });
    return { ok: true };
  }

  async listMine(userId: string) {
    const relations = await this.prisma.userRelation.findMany({
      where: { userId },
      include: { targetUser: { select: { id: true, bidNumber: true, fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return relations.map((r) => ({
      ...r,
      targetUser: { ...r.targetUser, bid: formatBid(r.targetUser.bidNumber) },
    }));
  }

  /** True if either party has blocked the other — used to stop a trade from being created between them. */
  async isBlocked(userIdA: string, userIdB: string): Promise<boolean> {
    const count = await this.prisma.userRelation.count({
      where: {
        type: RelationType.BLOCK,
        OR: [
          { userId: userIdA, targetUserId: userIdB },
          { userId: userIdB, targetUserId: userIdA },
        ],
      },
    });
    return count > 0;
  }
}
