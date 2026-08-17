import { Body, Controller, Get, NotFoundException, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';

@Controller('transfers')
@UseGuards(JwtAuthGuard)
export class TransfersController {
  constructor(private transfersService: TransfersService) {}

  @Post()
  send(@Req() req: any, @Body() dto: CreateTransferDto) {
    return this.transfersService.send(req.user.userId, dto);
  }

  @Get('mine')
  listMine(@Req() req: any) {
    return this.transfersService.listMine(req.user.userId);
  }

  @Get('resolve')
  async resolve(@Query('bid') bid: string) {
    const user = await this.transfersService.resolveRecipient(bid);
    if (!user) throw new NotFoundException('No trader found with that ID');
    return { id: user.id, fullName: user.fullName, isMerchant: user.isMerchant };
  }
}
