import { Injectable, Logger } from '@nestjs/common';

const APP_NAME = 'Birrly';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendVerificationEmail(to: string, token: string) {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
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
          subject: `Confirm your ${APP_NAME} account`,
          html: `
            <p>Welcome to ${APP_NAME}!</p>
            <p>Please confirm your email address by clicking the link below:</p>
            <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          `,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Resend API returned ${res.status}: ${body}`);
      }
    } catch (err) {
      this.logger.error(`Failed to send verification email to ${to}`, err as Error);
    }
  }
}
