import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { SendSupportMessageDto } from './dto/send-support-message.dto';

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

  @Get('tickets/:id/messages')
  getMessages(@Req() req: any, @Param('id') id: string) {
    return this.supportService.getMessages(id, req.user.userId, true);
  }

  @Post('tickets/:id/messages')
  sendMessage(@Req() req: any, @Param('id') id: string, @Body() dto: SendSupportMessageDto) {
    return this.supportService.sendMessage(id, req.user.userId, dto, { requireOwner: true });
  }

  @Get('admin/tickets')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPPORT)
  listAll() {
    return this.supportService.listAll();
  }

  @Get('admin/tickets/:id/messages')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPPORT)
  getMessagesAdmin(@Param('id') id: string) {
    return this.supportService.getMessages(id);
  }

  @Post('admin/tickets/:id/messages')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPPORT)
  sendMessageAdmin(@Req() req: any, @Param('id') id: string, @Body() dto: SendSupportMessageDto) {
    return this.supportService.sendMessage(id, req.user.userId, dto);
  }

  /**
   * Trade history and wallet transactions are money-adjacent, so this is
   * ADMIN-only — SUPPORT staff can message and resolve tickets, but not see
   * a user's financial activity. See RolesGuard / the SUPPORT role's scope.
   */
  @Get('admin/tickets/:id/context')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  getUserContext(@Param('id') id: string) {
    return this.supportService.getUserContext(id);
  }

  @Post('admin/tickets/:id/resolve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPPORT)
  resolve(@Req() req: any, @Param('id') id: string) {
    return this.supportService.resolve(req.user.userId, id);
  }

  @Delete('admin/tickets/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPPORT)
  deleteTicket(@Req() req: any, @Param('id') id: string) {
    return this.supportService.deleteTicket(req.user.userId, id);
  }
}
