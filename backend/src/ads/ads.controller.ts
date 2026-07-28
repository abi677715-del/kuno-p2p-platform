import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdsService } from './ads.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { AdSide } from '@prisma/client';

@Controller('ads')
export class AdsController {
  constructor(private adsService: AdsService) {}

  @Get()
  list(@Query('side') side?: AdSide) {
    return this.adsService.findActive(side);
  }

  @Get('rate')
  getRate() {
    return this.adsService.getIndicativeRate();
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@Req() req: any) {
    return this.adsService.findMine(req.user.userId);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.adsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: any, @Body() dto: CreateAdDto) {
    return this.adsService.create(req.user.userId, dto);
  }

  @Patch(':id/pause')
  @UseGuards(JwtAuthGuard)
  pause(@Req() req: any, @Param('id') id: string) {
    return this.adsService.pause(req.user.userId, id);
  }

  @Patch(':id/reactivate')
  @UseGuards(JwtAuthGuard)
  reactivate(@Req() req: any, @Param('id') id: string) {
    return this.adsService.reactivate(req.user.userId, id);
  }
}
