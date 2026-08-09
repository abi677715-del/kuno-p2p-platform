import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationPreferencesService } from './notification-preferences.service';
import { UpdateNotificationPreferencesDto } from './dto/notification-preferences.dto';

@Controller('notifications/preferences')
@UseGuards(JwtAuthGuard)
export class NotificationPreferencesController {
  constructor(private preferencesService: NotificationPreferencesService) {}

  @Get()
  getPreferences(@Req() req: any) {
    return this.preferencesService.getPreferences(req.user.userId);
  }

  @Post()
  updatePreferences(
    @Req() req: any,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.preferencesService.updatePreferences(req.user.userId, dto);
  }
}
