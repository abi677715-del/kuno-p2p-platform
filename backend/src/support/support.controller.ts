import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private supportService: SupportService) {}

  @Post('tickets')
  create(@Req() req: any, @Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(req.user.userId, dto);
  }

  @Get('tickets/mine')
  listMine(@Req() req: any) {
    return this.supportService.listMine(req.user.userId);
  }

  @Get('admin/tickets')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  listAll() {
    return this.supportService.listAll();
  }

  @Post('admin/tickets/:id/resolve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  resolve(@Param('id') id: string) {
    return this.supportService.resolve(id);
  }
}
