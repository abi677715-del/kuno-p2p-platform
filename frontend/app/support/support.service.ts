import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { SupportTicketStatus } from '@prisma/client';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  createTicket(userId: string, dto: CreateTicketDto) {
    return this.prisma.supportTicket.create({
      data: { userId, subject: dto.subject, message: dto.message },
    });
  }

  listMine(userId: string) {
    return this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  listAll() {
    return this.prisma.supportTicket.findMany({
      include: { user: { select: { email: true } } },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async resolve(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.prisma.supportTicket.update({
      where: { id },
      data: { status: SupportTicketStatus.RESOLVED },
    });
  }
}
