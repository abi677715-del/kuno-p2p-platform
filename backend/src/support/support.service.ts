import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { SupportTicketStatus } from '@prisma/client';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { SendSupportMessageDto } from './dto/send-support-message.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SupportService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

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

  private async findTicketOrThrow(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  /** A user can only message their own ticket — admins/support can message any ticket. */
  async sendMessage(ticketId: string, senderId: string, dto: SendSupportMessageDto, options: { requireOwner?: boolean } = {}) {
    if (!dto.message?.trim() && !dto.attachmentUrl) {
      throw new BadRequestException('Message must include text or an attachment');
    }
    const ticket = await this.findTicketOrThrow(ticketId);
    if (options.requireOwner && ticket.userId !== senderId) {
      throw new ForbiddenException('Not your ticket');
    }

    const created = await this.prisma.supportMessage.create({
      data: { ticketId, senderId, message: dto.message ?? '', attachmentUrl: dto.attachmentUrl },
    });

    if (senderId !== ticket.userId) {
      await this.notificationsService.create(ticket.userId, 'SUPPORT_REPLY', {
        ticketId,
        message: 'Support replied to your request.',
      });
    }

    return created;
  }

  async getMessages(ticketId: string, requesterId?: string, requireOwner = false) {
    const ticket = await this.findTicketOrThrow(ticketId);
    if (requireOwner && ticket.userId !== requesterId) {
      throw new ForbiddenException('Not your ticket');
    }
    return this.prisma.supportMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { email: true, role: true } } },
    });
  }

  /**
   * Gives an admin (not support staff — see role check at the controller)
   * a fuller picture of the ticket's user while resolving it: their trade
   * history and wallet transactions, so they don't have to ask the user to
   * re-explain what already happened elsewhere on the platform.
   */
  async getUserContext(ticketId: string) {
    const ticket = await this.findTicketOrThrow(ticketId);
    const [trades, transactions] = await Promise.all([
      this.prisma.trade.findMany({
        where: { OR: [{ buyerId: ticket.userId }, { sellerId: ticket.userId }] },
        include: {
          buyer: { select: { email: true } },
          seller: { select: { email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      this.prisma.walletTransaction.findMany({
        where: { wallet: { userId: ticket.userId } },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);
    return { trades, transactions };
  }

  async resolve(adminId: string, id: string) {
    const ticket = await this.findTicketOrThrow(id);
    const updated = await this.prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: SupportTicketStatus.RESOLVED },
    });
    await this.prisma.adminAuditLog.create({
      data: { adminId, action: 'SUPPORT_TICKET_RESOLVED', targetId: id },
    });
    return updated;
  }
}
