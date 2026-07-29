import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';
import { MerchantService } from './merchant.service';
import { ApplyMerchantDto } from './dto/apply-merchant.dto';
import { RejectMerchantDto } from './dto/reject-merchant.dto';

@Controller('merchant')
@UseGuards(JwtAuthGuard)
export class MerchantController {
  constructor(private merchantService: MerchantService) {}

  @Get('me')
  getStatus(@Req() req: any) {
    return this.merchantService.getStatus(req.user.userId);
  }

  @Post('apply')
  apply(@Req() req: any, @Body() dto: ApplyMerchantDto) {
    return this.merchantService.apply(req.user.userId, dto);
  }

  @Get('admin/pending')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  listPending() {
    return this.merchantService.listPending();
  }

  @Post('admin/:id/approve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  approve(@Param('id') id: string) {
    return this.merchantService.approve(id);
  }

  @Post('admin/:id/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  reject(@Param('id') id: string, @Body() dto: RejectMerchantDto) {
    return this.merchantService.reject(id, dto);
  }
}
