import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { SetRoleDto } from './dto/set-role.dto';
import { formatBid } from '../common/bid';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async me(@Req() req: any) {
    const user = await this.usersService.findById(req.user.userId);
    return {
      id: user?.id,
      email: user?.email,
      fullName: user?.fullName,
      phone: user?.phone,
      role: user?.role,
      emailVerified: user?.emailVerified,
      twoFaEnabled: user?.twoFaEnabled,
      avatar: user?.avatar,
      defaultPaymentMethods: user?.defaultPaymentMethods,
      bid: user ? formatBid(user.bidNumber) : null,
      isMerchant: user?.isMerchant,
      termsAccepted: !!user?.termsAcceptedAt,
    };
  }

  @Post('me/accept-terms')
  acceptTerms(@Req() req: any) {
    return this.usersService.acceptTerms(req.user.userId);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async listAll() {
    const users = await this.usersService.listAllForAdmin();
    return users.map((u) => ({ ...u, bid: formatBid(u.bidNumber) }));
  }

  @Patch('admin/:id/merchant')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  setMerchantStatus(@Param('id') id: string, @Body() dto: UpdateMerchantDto) {
    return this.usersService.setMerchantStatus(id, dto.isMerchant);
  }

  @Patch('admin/:id/role')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  setRole(@Param('id') id: string, @Body() dto: SetRoleDto) {
    return this.usersService.setRole(id, dto.role);
  }

  @Patch('me')
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(req.user.userId, dto);
    return { fullName: user.fullName, phone: user.phone, defaultPaymentMethods: user.defaultPaymentMethods };
  }

  @Post('me/change-password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.userId, dto.currentPassword, dto.newPassword);
  }

  @Post('me/avatar')
  async updateAvatar(@Req() req: any, @Body() dto: UpdateAvatarDto) {
    const user = await this.usersService.setAvatar(req.user.userId, dto.avatar);
    return { avatar: user.avatar };
  }
}
