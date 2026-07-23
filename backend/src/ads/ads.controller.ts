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
}
