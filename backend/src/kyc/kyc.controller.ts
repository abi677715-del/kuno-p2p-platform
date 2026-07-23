import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';
import { KycService } from './kyc.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { RejectKycDto } from './dto/reject-kyc.dto';

const storage = diskStorage({
  destination: './uploads/kyc',
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
    cb(null, unique);
  },
});

@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(private kycService: KycService) {}

  @Post('submit')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'document', maxCount: 1 },
        { name: 'selfie', maxCount: 1 },
      ],
      { storage, limits: { fileSize: 8 * 1024 * 1024 } },
    ),
  )
  submit(
    @Req() req: any,
    @Body() dto: SubmitKycDto,
    @UploadedFiles() files: { document?: Express.Multer.File[]; selfie?: Express.Multer.File[] },
  ) {
    if (!files?.document?.[0] || !files?.selfie?.[0]) {
      throw new BadRequestException('Both an ID document and a selfie are required');
    }
    return this.kycService.submit(
      req.user.userId,
      dto,
      `/uploads/kyc/${files.document[0].filename}`,
      `/uploads/kyc/${files.selfie[0].filename}`,
    );
  }

  @Get('me')
  getMine(@Req() req: any) {
    return this.kycService.getMine(req.user.userId);
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  listPending() {
    return this.kycService.listPending();
  }

  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  approve(@Req() req: any, @Param('id') id: string) {
    return this.kycService.approve(req.user.userId, id);
  }

  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  reject(@Req() req: any, @Param('id') id: string, @Body() dto: RejectKycDto) {
    return this.kycService.reject(req.user.userId, id, dto);
  }
}
