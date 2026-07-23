import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';
import { TradesService } from './trades.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { DisputeTradeDto } from './dto/dispute-trade.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@Controller('trades')
@UseGuards(JwtAuthGuard)
export class TradesController {
  constructor(private tradesService: TradesService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateTradeDto) {
    return this.tradesService.createTrade(req.user.userId, dto);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.tradesService.findById(id);
  }

  @Post(':id/paid')
  markPaid(@Req() req: any, @Param('id') id: string) {
    return this.tradesService.markPaid(req.user.userId, id);
  }

  @Post(':id/confirm')
  confirm(@Req() req: any, @Param('id') id: string) {
    return this.tradesService.confirmPayment(req.user.userId, id);
  }

  @Post(':id/cancel')
  cancel(@Req() req: any, @Param('id') id: string) {
    return this.tradesService.cancelTrade(req.user.userId, id);
  }

  @Post(':id/dispute')
  dispute(@Req() req: any, @Param('id') id: string, @Body() dto: DisputeTradeDto) {
    return this.tradesService.raiseDispute(req.user.userId, id, dto);
  }

  @Get(':id/messages')
  getMessages(@Req() req: any, @Param('id') id: string) {
    return this.tradesService.getMessages(req.user.userId, id);
  }

  @Post(':id/messages')
  sendMessage(@Req() req: any, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.tradesService.sendMessage(req.user.userId, id, dto);
  }

  @Get('admin/disputes')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  listDisputes() {
    return this.tradesService.listOpenDisputes();
  }

  @Post('admin/disputes/:id/resolve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  resolveDispute(@Req() req: any, @Param('id') id: string, @Body() dto: ResolveDisputeDto) {
    return this.tradesService.resolveDispute(req.user.userId, id, dto);
  }
}
