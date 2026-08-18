import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BannerPlacement, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { BannerAdsService } from './banner-ads.service';
import { SubmitBannerAdDto } from './dto/submit-banner-ad.dto';
import { RejectBannerAdDto } from './dto/reject-banner-ad.dto';

// A public, unauthenticated upload endpoint gets spammed if it isn't
// tightly capped — this is well below the global 100/min default.
const SUBMIT_THROTTLE = { default: { limit: 3, ttl: 60_000 } };

const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

const storage = diskStorage({
  destination: './public-uploads/banner-ads',
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
    cb(null, unique);
  },
});

@Controller('banner-ads')
export class BannerAdsController {
  constructor(private bannerAdsService: BannerAdsService) {}

  /** Public — any outside advertiser can submit a video ad for review, no account needed. */
  @Post('submit')
  @Throttle(SUBMIT_THROTTLE)
  @UseInterceptors(FileInterceptor('video', { storage, limits: { fileSize: 40 * 1024 * 1024 } }))
  submit(@Body() dto: SubmitBannerAdDto, @UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('A video file (mp4, webm, or mov) is required');
    }
    if (!VIDEO_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only mp4, webm, or mov video files are accepted');
    }
    return this.bannerAdsService.submit(dto, `/public-uploads/banner-ads/${file.filename}`);
  }

  /** Public — the frontend widgets on the marketplace/homepage fetch whatever's approved for their slot. */
  @Get('active')
  listActive(@Query('placement') placement?: string) {
    const isValid = !!placement && (Object.values(BannerPlacement) as string[]).includes(placement);
    return this.bannerAdsService.listActive(isValid ? (placement as BannerPlacement) : undefined);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  listPending() {
    return this.bannerAdsService.listPending();
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  approve(@Req() req: any, @Param('id') id: string) {
    return this.bannerAdsService.approve(req.user.userId, id);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  reject(@Req() req: any, @Param('id') id: string, @Body() dto: RejectBannerAdDto) {
    return this.bannerAdsService.reject(req.user.userId, id, dto);
  }
}
