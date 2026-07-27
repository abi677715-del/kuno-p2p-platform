import { Injectable, Logger } from '@nestjs/common';

const APP_NAME = 'Birrly';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private async send(to: string, subject: string, html: string) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.MAIL_FROM ?? 'onboarding@resend.dev',
          to,
          subject,
          html,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Resend API returned ${res.status}: ${body}`);
      }
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}`, err as Error);
    }
  }

  sendVerificationEmail(to: string, token: string) {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    return this.send(
      to,
      `Confirm your ${APP_NAME} account`,
      `
        <p>Welcome to ${APP_NAME}!</p>
        <p>Please confirm your email address by clicking the link below:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      `,
    );
  }

  sendTradeUpdateEmail(to: string, subject: string, message: string, tradeId: string) {
    const tradeUrl = `${process.env.FRONTEND_URL}/trades/${tradeId}`;
    return this.send(
      to,
      `${subject} — ${APP_NAME}`,
      `
        <p>${message}</p>
        <p><a href="${tradeUrl}">View trade</a></p>
      `,
    );
  }
}
