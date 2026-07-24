import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Currency, Role, User } from '@prisma/client';

function isBootstrapAdmin(email: string) {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Lets ops promote an account to ADMIN just by listing its email in the
   * ADMIN_EMAILS env var, instead of hand-editing the database — applied
   * on every login so it also catches accounts that already existed.
   */
  async promoteIfBootstrapAdmin(user: User): Promise<User> {
    if (user.role === Role.ADMIN || !isBootstrapAdmin(user.email)) {
      return user;
    }
    return this.prisma.user.update({ where: { id: user.id }, data: { role: Role.ADMIN } });
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
        data: { email, passwordHash, phone, role: isBootstrapAdmin(email) ? Role.ADMIN : Role.USER },
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
