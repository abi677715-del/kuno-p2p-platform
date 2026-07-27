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

      await tx.wallet.createMany({
        data: [
          { userId: user.id, currency: Currency.USDT },
          { userId: user.id, currency: Currency.ETB },
        ],
      });

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

  updateProfile(userId: string, data: { fullName?: string; phone?: string }) {
    return this.prisma.user.update({ where: { id: userId }, data });
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
}
