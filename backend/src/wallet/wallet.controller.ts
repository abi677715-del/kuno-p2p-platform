import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Network, Role } from '@prisma/client';
import { WalletService } from './wallet.service';
import { RequestDepositDto } from './dto/request-deposit.dto';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get('balance')
  getBalances(@Req() req: any) {
    return this.walletService.getBalances(req.user.userId);
  }

  @Get('networks')
  listSupportedNetworks() {
    return this.walletService.listSupportedNetworks();
  }

  @Get('deposit-address')
  getDepositAddress(@Query('network') network: Network) {
    return this.walletService.getDepositAddress(network ?? Network.TRC20);
  }

  @Post('deposit')
  requestDeposit(@Req() req: any, @Body() dto: RequestDepositDto) {
    return this.walletService.requestDeposit(req.user.userId, dto.currency, dto.amount, dto.txHash, dto.network);
  }

  @Post('withdraw')
  requestWithdrawal(@Req() req: any, @Body() dto: RequestWithdrawalDto) {
    return this.walletService.requestWithdrawal(req.user.userId, dto.currency, dto.amount, dto.toAddress, dto.network);
  }

  @Get('transactions')
  listMine(@Req() req: any) {
    return this.walletService.listMyTransactions(req.user.userId);
  }

  // --- Admin: manual confirmation, since there's no on-chain watcher ---

  @Get('admin/deposits/pending')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  listPendingDeposits() {
    return this.walletService.listPendingDeposits();
  }

  @Post('admin/deposits/:id/confirm')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  confirmDeposit(@Param('id') id: string) {
    return this.walletService.confirmDeposit(id);
  }

  @Post('admin/deposits/:id/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  rejectDeposit(@Param('id') id: string) {
    return this.walletService.rejectDeposit(id);
  }

  @Get('admin/withdrawals/pending')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  listPendingWithdrawals() {
    return this.walletService.listPendingWithdrawals();
  }

  @Post('admin/withdrawals/:id/confirm')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  confirmWithdrawal(@Param('id') id: string) {
    return this.walletService.confirmWithdrawal(id);
  }

  @Post('admin/withdrawals/:id/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  rejectWithdrawal(@Param('id') id: string) {
    return this.walletService.rejectWithdrawal(id);
  }

  @Get('admin/platform-balance')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  getPlatformBalance() {
    return this.walletService.getPlatformBalances();
  }
}
