import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Currency } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  setTwoFaSecret(userId: string, secret: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { twoFaSecret: secret } });
  }

  setTwoFaEnabled(userId: string, enabled: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { twoFaEnabled: enabled, ...(enabled ? {} : { twoFaSecret: null }) },
    });
  }

  /**
   * Creates a user plus their USDT and ETB wallets in a single transaction,
   * so a user can never exist without wallets to trade with.
   */
  async createWithWallets(email: string, passwordHash: string, phone?: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, passwordHash, phone },
      });

      await tx.wallet.createMany({
        data: [
          { userId: user.id, currency: Currency.USDT },
          { userId: user.id, currency: Currency.ETB },
        ],
      });

      return user;
    });
  }
}
