import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';
import { AppealsService } from './appeals.service';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { ResolveAppealDto } from './dto/resolve-appeal.dto';

@Controller('appeals')
@UseGuards(JwtAuthGuard)
export class AppealsController {
  constructor(private appealsService: AppealsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateAppealDto) {
    return this.appealsService.create(req.user.userId, dto);
  }

  @Get('mine')
  listMine(@Req() req: any) {
    return this.appealsService.listMine(req.user.userId);
  }

  @Get('admin/open')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  listOpen() {
    return this.appealsService.listOpen();
  }

  @Post('admin/:id/resolve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  resolve(@Req() req: any, @Param('id') id: string, @Body() dto: ResolveAppealDto) {
    return this.appealsService.resolve(req.user.userId, id, dto.resolution);
  }

  @Post('admin/:id/dismiss')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  dismiss(@Req() req: any, @Param('id') id: string, @Body() dto: ResolveAppealDto) {
    return this.appealsService.dismiss(req.user.userId, id, dto.resolution);
  }
}
