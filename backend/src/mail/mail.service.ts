import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

const APP_NAME = 'Birrly';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    auth: { user: 'resend', pass: process.env.RESEND_API_KEY },
  });

  async sendVerificationEmail(to: string, token: string) {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM ?? 'onboarding@resend.dev',
        to,
        subject: `Confirm your ${APP_NAME} account`,
        html: `
          <p>Welcome to ${APP_NAME}!</p>
          <p>Please confirm your email address by clicking the link below:</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        `,
      });
    } catch (err) {
      this.logger.error(`Failed to send verification email to ${to}`, err as Error);
    }
  }
}
