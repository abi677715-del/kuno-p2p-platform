import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { PushSubscribeDto } from './dto/push-subscribe.dto';
import { PushUnsubscribeDto } from './dto/push-unsubscribe.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private pushService: PushService,
  ) {}

  @Get('push/vapid-public-key')
  getVapidPublicKey() {
    return this.pushService.getPublicKey();
  }

  @Post('push/subscribe')
  @UseGuards(JwtAuthGuard)
  subscribePush(@Req() req: any, @Body() dto: PushSubscribeDto) {
    return this.pushService.subscribe(req.user.userId, dto);
  }

  @Post('push/unsubscribe')
  @UseGuards(JwtAuthGuard)
  unsubscribePush(@Body() dto: PushUnsubscribeDto) {
    return this.pushService.unsubscribe(dto.endpoint);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  listMine(@Req() req: any) {
    return this.notificationsService.listMine(req.user.userId);
  }

  @Post(':id/read')
  @UseGuards(JwtAuthGuard)
  markRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationsService.markRead(req.user.userId, id);
  }

  @Post('read-all')
  @UseGuards(JwtAuthGuard)
  markAllRead(@Req() req: any) {
    return this.notificationsService.markAllRead(req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Req() req: any, @Param('id') id: string) {
    return this.notificationsService.delete(req.user.userId, id);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  deleteAll(@Req() req: any) {
    return this.notificationsService.deleteAll(req.user.userId);
  }
}
