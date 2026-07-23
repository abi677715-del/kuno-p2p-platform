import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Currency, Prisma, Role, TxType, TxStatus } from '@prisma/client';
import * as QRCode from 'qrcode';

const PLATFORM_ACCOUNT_EMAIL = 'platform@birrly.internal';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getBalances(userId: string) {
    const wallets = await this.prisma.wallet.findMany({ where: { userId } });
    if (!wallets.length) {
      throw new NotFoundException('No wallets found for this user');
    }
    return wallets;
  }

  /**
   * Every user deposits to the same custodial TRC20 address — there's no
   * per-user address or on-chain watcher. The user sends USDT, then tells us
   * the transaction hash here; an admin checks it on TronScan and confirms.
   */
  async getDepositAddress() {
    const address = process.env.PLATFORM_DEPOSIT_ADDRESS;
    if (!address) throw new BadRequestException('Deposit address is not configured');
    const qrCodeDataUrl = await QRCode.toDataURL(address);
    return { address, network: 'TRC20', qrCodeDataUrl };
  }

  /** User claims they sent funds to the platform address; sits as PENDING until an admin confirms on-chain. */
  async requestDeposit(userId: string, currency: Currency, amount: string, txHash: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId_currency: { userId, currency } } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const existing = await this.prisma.walletTransaction.findFirst({
      where: { type: TxType.DEPOSIT, referenceId: txHash },
    });
    if (existing) throw new BadRequestException('This transaction hash has already been submitted');

    return this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: TxType.DEPOSIT,
        amount,
        referenceId: txHash,
        status: TxStatus.PENDING,
      },
    });
  }

  /** Admin confirms they've verified the on-chain transaction, crediting the user's balance. */
  async confirmDeposit(transactionId: string) {
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.walletTransaction.findUnique({ where: { id: transactionId } });
      if (!record || record.type !== TxType.DEPOSIT) throw new NotFoundException('Deposit not found');
      if (record.status !== TxStatus.PENDING) throw new BadRequestException('Deposit already processed');

      await tx.wallet.update({ where: { id: record.walletId }, data: { balance: { increment: record.amount } } });
      return tx.walletTransaction.update({ where: { id: transactionId }, data: { status: TxStatus.CONFIRMED } });
    });
  }

  async rejectDeposit(transactionId: string) {
    const record = await this.prisma.walletTransaction.findUnique({ where: { id: transactionId } });
    if (!record || record.type !== TxType.DEPOSIT) throw new NotFoundException('Deposit not found');
    if (record.status !== TxStatus.PENDING) throw new BadRequestException('Deposit already processed');
    return this.prisma.walletTransaction.update({ where: { id: transactionId }, data: { status: TxStatus.FAILED } });
  }

  /**
   * User requests a withdrawal to their own external address. Funds are moved
   * to locked immediately so they can't be spent elsewhere while the request
   * is pending; an admin manually sends the USDT out from the platform wallet.
   */
  async requestWithdrawal(userId: string, currency: Currency, amount: string, toAddress: string) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId_currency: { userId, currency } } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const updated = await tx.wallet.updateMany({
        where: { id: wallet.id, balance: { gte: amount } },
        data: { balance: { decrement: amount }, lockedBalance: { increment: amount } },
      });
      if (updated.count === 0) throw new BadRequestException('Insufficient available balance');

      return tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: TxType.WITHDRAWAL,
          amount,
          referenceId: toAddress,
          status: TxStatus.PENDING,
        },
      });
    });
  }

  /** Admin confirms the USDT has actually been sent out from the platform wallet. */
  async confirmWithdrawal(transactionId: string) {
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.walletTransaction.findUnique({ where: { id: transactionId } });
      if (!record || record.type !== TxType.WITHDRAWAL) throw new NotFoundException('Withdrawal not found');
      if (record.status !== TxStatus.PENDING) throw new BadRequestException('Withdrawal already processed');

      await tx.wallet.update({ where: { id: record.walletId }, data: { lockedBalance: { decrement: record.amount } } });
      return tx.walletTransaction.update({ where: { id: transactionId }, data: { status: TxStatus.CONFIRMED } });
    });
  }

  /** Admin rejects a withdrawal (e.g. bad address) — funds return to the user's available balance. */
  async rejectWithdrawal(transactionId: string) {
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.walletTransaction.findUnique({ where: { id: transactionId } });
      if (!record || record.type !== TxType.WITHDRAWAL) throw new NotFoundException('Withdrawal not found');
      if (record.status !== TxStatus.PENDING) throw new BadRequestException('Withdrawal already processed');

      await tx.wallet.update({
        where: { id: record.walletId },
        data: { lockedBalance: { decrement: record.amount }, balance: { increment: record.amount } },
      });
      return tx.walletTransaction.update({ where: { id: transactionId }, data: { status: TxStatus.FAILED } });
    });
  }

  listMyTransactions(userId: string) {
    return this.prisma.walletTransaction.findMany({
      where: { wallet: { userId } },
      orderBy: { createdAt: 'desc' },
    });
  }

  listPendingDeposits() {
    return this.prisma.walletTransaction.findMany({
      where: { type: TxType.DEPOSIT, status: TxStatus.PENDING },
      include: { wallet: { include: { user: { select: { email: true } } } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  listPendingWithdrawals() {
    return this.prisma.walletTransaction.findMany({
      where: { type: TxType.WITHDRAWAL, status: TxStatus.PENDING },
      include: { wallet: { include: { user: { select: { email: true } } } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Admin view of commission collected so far, sitting in the platform's own wallet. */
  async getPlatformBalances() {
    const platformUser = await this.prisma.user.findUnique({ where: { email: PLATFORM_ACCOUNT_EMAIL } });
    if (!platformUser) return [];
    return this.prisma.wallet.findMany({ where: { userId: platformUser.id } });
  }

  /**
   * Moves `amount` from a wallet's available balance into its locked balance.
   * Called when a trade enters escrow. Runs in a transaction with a
   * conditional update so two concurrent locks can't overdraw the balance.
   */
  async lockFunds(userId: string, currency: Currency, amount: string, referenceId: string) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId_currency: { userId, currency } } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const updated = await tx.wallet.updateMany({
        where: { id: wallet.id, balance: { gte: amount } },
        data: {
          balance: { decrement: amount },
          lockedBalance: { increment: amount },
        },
      });

      if (updated.count === 0) {
        throw new BadRequestException('Insufficient available balance');
      }

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: TxType.LOCK,
          amount,
          referenceId,
          status: TxStatus.CONFIRMED,
        },
      });
    });
  }

  /**
   * Finds (or lazily creates) the platform's own system account and wallet —
   * this is where the trade commission accumulates. It's a real user row so
   * it reuses the same wallet/ledger machinery as everyone else, but it has
   * no password anyone can log in with and isn't shown anywhere in the UI.
   */
  private async getOrCreatePlatformWallet(tx: Prisma.TransactionClient, currency: Currency) {
    let platformUser = await tx.user.findUnique({ where: { email: PLATFORM_ACCOUNT_EMAIL } });
    if (!platformUser) {
      platformUser = await tx.user.create({
        data: { email: PLATFORM_ACCOUNT_EMAIL, passwordHash: 'no-login-platform-account', role: Role.ADMIN },
      });
    }
    let wallet = await tx.wallet.findUnique({ where: { userId_currency: { userId: platformUser.id, currency } } });
    if (!wallet) {
      wallet = await tx.wallet.create({ data: { userId: platformUser.id, currency } });
    }
    return wallet;
  }

  /**
   * Releases locked funds to the counterparty on trade completion, minus the
   * platform's commission (PLATFORM_FEE_PERCENT, default 2%), which goes to
   * the platform's own wallet instead of the buyer. Returns the split so
   * callers can show/notify the exact amounts.
   */
  async releaseFunds(fromUserId: string, toUserId: string, currency: Currency, amount: string, referenceId: string) {
    const feePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT ?? '2') / 100;

    return this.prisma.$transaction(async (tx) => {
      const fromWallet = await tx.wallet.findUnique({ where: { userId_currency: { userId: fromUserId, currency } } });
      const toWallet = await tx.wallet.findUnique({ where: { userId_currency: { userId: toUserId, currency } } });
      if (!fromWallet || !toWallet) throw new NotFoundException('Wallet not found');

      const total = parseFloat(amount);
      const feeAmount = (total * feePercent).toFixed(8);
      const netAmount = (total - parseFloat(feeAmount)).toFixed(8);

      const platformWallet = await this.getOrCreatePlatformWallet(tx, currency);

      await tx.wallet.update({
        where: { id: fromWallet.id },
        data: { lockedBalance: { decrement: amount } },
      });
      await tx.wallet.update({
        where: { id: toWallet.id },
        data: { balance: { increment: netAmount } },
      });
      if (parseFloat(feeAmount) > 0) {
        await tx.wallet.update({
          where: { id: platformWallet.id },
          data: { balance: { increment: feeAmount } },
        });
      }

      await tx.walletTransaction.createMany({
        data: [
          { walletId: fromWallet.id, type: TxType.RELEASE, amount, referenceId, status: TxStatus.CONFIRMED },
          { walletId: toWallet.id, type: TxType.DEPOSIT, amount: netAmount, referenceId, status: TxStatus.CONFIRMED },
          { walletId: platformWallet.id, type: TxType.FEE, amount: feeAmount, referenceId, status: TxStatus.CONFIRMED },
        ],
      });

      return { grossAmount: amount, feeAmount, netAmount, feePercent };
    });
  }

  /** Returns locked funds back to their original owner (cancelled/disputed trade). */
  async refundFunds(userId: string, currency: Currency, amount: string, referenceId: string) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId_currency: { userId, currency } } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          lockedBalance: { decrement: amount },
          balance: { increment: amount },
        },
      });

      await tx.walletTransaction.create({
        data: { walletId: wallet.id, type: TxType.REFUND, amount, referenceId, status: TxStatus.CONFIRMED },
      });
    });
  }
}
