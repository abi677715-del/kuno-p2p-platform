import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma.service';
import { Currency, Role, TxStatus, TxType, User } from '@prisma/client';
import { formatBid, parseBid } from '../common/bid';

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

  /**
   * Emails are compared case-insensitively — the column itself is
   * case-sensitive, so without this "Admin@x.com" and "admin@x.com" could be
   * two separate accounts. An exact match wins if an old mixed-case
   * duplicate already exists.
   */
  async findByEmail(email: string) {
    const trimmed = email.trim();
    const exact = await this.prisma.user.findUnique({ where: { email: trimmed } });
    if (exact) return exact;
    return this.prisma.user.findFirst({ where: { email: { equals: trimmed, mode: 'insensitive' } } });
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
   * Grants or revokes SUPPORT staff access (support tickets only — no
   * wallet, KYC, dispute, or user-management routes). Can't be used to
   * grant ADMIN; see SetRoleDto for why.
   */
  setRole(userId: string, role: 'USER' | 'SUPPORT') {
    return this.prisma.user.update({ where: { id: userId }, data: { role: role as Role } });
  }

  /**
   * Lets ops promote an account to ADMIN just by listing its email in the
   * ADMIN_EMAILS env var, instead of hand-editing the database — applied
   * on every login so it also catches accounts that already existed.
   */
  async promoteIfBootstrapAdmin(user: User): Promise<User> {
    // Requires a verified email: otherwise anyone could register a listed
    // admin address (before the real admin does) and be promoted on login.
    if (user.role === Role.ADMIN || !user.emailVerified || !isBootstrapAdmin(user.email)) {
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
      data: {
        twoFaEnabled: enabled,
        ...(enabled ? {} : { twoFaSecret: null, twoFaBackupCodes: [] }),
      },
    });
  }

  setTwoFaBackupCodes(userId: string, hashedCodes: string[]) {
    return this.prisma.user.update({ where: { id: userId }, data: { twoFaBackupCodes: hashedCodes } });
  }

  /** Removes one consumed backup code hash, leaving the rest usable. */
  async consumeTwoFaBackupCode(userId: string, hashToRemove: string) {
    const user = await this.findById(userId);
    const remaining = (user?.twoFaBackupCodes ?? []).filter((h) => h !== hashToRemove);
    await this.prisma.user.update({ where: { id: userId }, data: { twoFaBackupCodes: remaining } });
  }

  /** Resolves a referral code (someone's trader ID) to their user id, or undefined if it doesn't match anyone. */
  async resolveReferrer(refCode: string): Promise<string | undefined> {
    const bidNumber = parseBid(refCode);
    if (bidNumber === null) return undefined;
    const referrer = await this.prisma.user.findUnique({ where: { bidNumber }, select: { id: true } });
    return referrer?.id;
  }

  /**
   * Creates a user plus their USDT and ETB wallets in a single transaction,
   * so a user can never exist without wallets to trade with. Also generates
   * an emailVerificationToken so the caller can send a confirmation email.
   */
  async createWithWallets(email: string, passwordHash: string, fullName: string, phone: string, referredById?: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.trim().toLowerCase(),
          passwordHash,
          fullName,
          phone,
          emailVerificationToken: randomUUID(),
          // Never ADMIN at signup — see promoteIfBootstrapAdmin.
          role: Role.USER,
          referredById,
        },
      });

      // Only USDT is ever escrowed on-platform — ETB moves directly between
      // traders via bank/mobile money, so there's no fiat wallet to track.
      await tx.wallet.create({ data: { userId: user.id, currency: Currency.USDT } });

      return user;
    });
  }

  /**
   * Who a user has referred, and how much they've earned in referral bonuses
   * so far — the referral link itself is just their own trader ID, generated
   * on the frontend, so there's nothing to create here.
   */
  async getReferralStats(userId: string) {
    const [referrals, earnings] = await Promise.all([
      this.prisma.user.findMany({
        where: { referredById: userId },
        select: { fullName: true, email: true, bidNumber: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletTransaction.aggregate({
        where: {
          type: TxType.REFERRAL,
          status: TxStatus.CONFIRMED,
          wallet: { userId, currency: Currency.USDT },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      referredCount: referrals.length,
      totalEarnedUsdt: (earnings._sum.amount ?? 0).toString(),
      referrals: referrals.map((r) => ({
        fullName: r.fullName,
        email: r.email,
        bid: formatBid(r.bidNumber),
        createdAt: r.createdAt,
      })),
    };
  }

  setSessionInvalidatedAt(userId: string, when: Date) {
    return this.prisma.user.update({ where: { id: userId }, data: { sessionInvalidatedAt: when } });
  }

  /** The user's most recent successful logins, for a "recent activity" list — newest first. */
  getLoginActivity(userId: string, limit = 10) {
    return this.prisma.loginEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
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

  acceptTerms(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { termsAcceptedAt: new Date() } });
  }

  /** Blocks posting ads or starting trades until the user has agreed to the current Terms of Service. */
  async assertTermsAccepted(userId: string) {
    const user = await this.findById(userId);
    if (!user?.termsAcceptedAt) {
      throw new ForbiddenException('Please accept the Terms of Service before continuing to trade');
    }
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
      // Resetting a password is how someone recovers a stolen account, so it
      // also signs out every existing session (see JwtStrategy).
      data: { passwordHash, passwordResetToken: null, passwordResetExpires: null, sessionInvalidatedAt: new Date() },
    });
    return { changed: true };
  }
}
