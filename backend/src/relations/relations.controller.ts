import { Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RelationType } from '@prisma/client';
import { RelationsService } from './relations.service';

@Controller('relations')
@UseGuards(JwtAuthGuard)
export class RelationsController {
  constructor(private relationsService: RelationsService) {}

  @Get('mine')
  listMine(@Req() req: any) {
    return this.relationsService.listMine(req.user.userId);
  }

  @Post(':targetUserId/block')
  block(@Req() req: any, @Param('targetUserId') targetUserId: string) {
    return this.relationsService.setRelation(req.user.userId, targetUserId, RelationType.BLOCK);
  }

  @Delete(':targetUserId/block')
  unblock(@Req() req: any, @Param('targetUserId') targetUserId: string) {
    return this.relationsService.removeRelation(req.user.userId, targetUserId, RelationType.BLOCK);
  }

  @Post(':targetUserId/favorite')
  favorite(@Req() req: any, @Param('targetUserId') targetUserId: string) {
    return this.relationsService.setRelation(req.user.userId, targetUserId, RelationType.FAVORITE);
  }

  @Delete(':targetUserId/favorite')
  unfavorite(@Req() req: any, @Param('targetUserId') targetUserId: string) {
    return this.relationsService.removeRelation(req.user.userId, targetUserId, RelationType.FAVORITE);
  }
}
