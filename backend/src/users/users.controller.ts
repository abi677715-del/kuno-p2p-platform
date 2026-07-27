import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async me(@Req() req: any) {
    const user = await this.usersService.findById(req.user.userId);
    return {
      email: user?.email,
      fullName: user?.fullName,
      phone: user?.phone,
      role: user?.role,
      emailVerified: user?.emailVerified,
      twoFaEnabled: user?.twoFaEnabled,
    };
  }

  @Patch('me')
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(req.user.userId, dto);
    return { fullName: user.fullName, phone: user.phone };
  }

  @Post('me/change-password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.userId, dto.currentPassword, dto.newPassword);
  }
}
