import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma.service';
import { Currency, Role, User } from '@prisma/client';

const SALT_ROUNDS = 12;

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

  listAllForAdmin() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        bidNumber: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        emailVerified: true,
        isMerchant: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Merchants trade on their own ads at a discounted platform fee — see WalletService.getFeePercent. */
  setMerchantStatus(userId: string, isMerchant: boolean) {
    return this.prisma.user.update({ where: { id: userId }, data: { isMerchant } });
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
    await this.prisma.adminAuditLog.create({
      data: { adminId: user.id, action: 'ADMIN_PROMOTED_VIA_BOOTSTRAP', targetId: user.id },
    });
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
   * so a user can never exist without wallets to trade with. Also generates
   * an emailVerificationToken so the caller can send a confirmation email.
   */
  async createWithWallets(email: string, passwordHash: string, fullName: string, phone: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          fullName,
          phone,
          emailVerificationToken: randomUUID(),
          role: isBootstrapAdmin(email) ? Role.ADMIN : Role.USER,
        },
      });

      // Only USDT is ever escrowed on-platform — ETB moves directly between
      // traders via bank/mobile money, so there's no fiat wallet to track.
      await tx.wallet.create({ data: { userId: user.id, currency: Currency.USDT } });

      return user;
    });
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({ where: { emailVerificationToken: token } });
    if (!user) return null;
    return this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerificationToken: null },
    });
  }

  updateProfile(userId: string, data: { fullName?: string; phone?: string; defaultPaymentMethods?: string[] }) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  setAvatar(userId: string, avatar: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { avatar } });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) throw new BadRequestException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { changed: true };
  }

  setPasswordResetToken(userId: string, token: string, expires: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    });
  }

  findByPasswordResetToken(token: string) {
    return this.prisma.user.findUnique({ where: { passwordResetToken: token } });
  }

  async resetPassword(userId: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, passwordResetToken: null, passwordResetExpires: null },
    });
    return { changed: true };
  }
}
