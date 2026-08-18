import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { basename, extname, join } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '@prisma/client';
import { KycService } from './kyc.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { RejectKycDto } from './dto/reject-kyc.dto';
import { BulkKycActionDto } from './dto/bulk-kyc-action.dto';
import { BulkRejectKycDto } from './dto/bulk-reject-kyc.dto';

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

  /**
   * Streams a submitted ID document or selfie. Only the person who submitted
   * it, or staff (ADMIN/SUPPORT), can view it — these used to be served as
   * plain public static files, reachable by anyone with the URL.
   */
  @Get('file/:id/:type')
  async getFile(@Req() req: any, @Param('id') id: string, @Param('type') type: string, @Res() res: Response) {
    const record = await this.kycService.getById(id);
    const isOwner = record.userId === req.user.userId;
    const isStaff = req.user.role === Role.ADMIN || req.user.role === Role.SUPPORT;
    if (!isOwner && !isStaff) {
      throw new ForbiddenException('You do not have permission to view this file');
    }

    const url = type === 'document' ? record.documentUrl : type === 'selfie' ? record.selfieUrl : null;
    if (!url) throw new NotFoundException('File not found');

    // basename() strips any directory-traversal attempt from the stored path.
    const filePath = join(process.cwd(), 'uploads', 'kyc', basename(url));
    res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) res.status(404).json({ message: 'File not found' });
    });
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  listPending() {
    return this.kycService.listPending();
  }

  @Post('bulk-approve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  bulkApprove(@Req() req: any, @Body() dto: BulkKycActionDto) {
    return this.kycService.bulkApprove(req.user.userId, dto.ids);
  }

  @Post('bulk-reject')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  bulkReject(@Req() req: any, @Body() dto: BulkRejectKycDto) {
    return this.kycService.bulkReject(req.user.userId, dto.ids, { reason: dto.reason });
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
