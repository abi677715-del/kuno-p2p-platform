import { Injectable } from '@nestjs/common';

export interface NotificationTemplate {
  subject: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  urgency: 'low' | 'medium' | 'high';
}

@Injectable()
export class NotificationTemplatesService {
  getTemplate(type: string): NotificationTemplate {
    const templates: Record<string, NotificationTemplate> = {
      TRADE_ESCROW_LOCKED: {
        subject: '⏳ Escrow locked — send payment now',
        title: 'Escrow Locked',
        message: 'The seller has locked USDT in escrow. You can now send the ETB payment via your preferred method.',
        actionLabel: 'View Trade',
        urgency: 'high',
      },
      TRADE_MARKED_PAID: {
        subject: '💳 Buyer marked payment sent',
        title: 'Payment Marked Sent',
        message: 'The buyer has marked the ETB payment as sent. Please verify receipt and confirm to release the USDT.',
        actionLabel: 'Confirm Payment',
        urgency: 'high',
      },
      TRADE_COMPLETED: {
        subject: '✅ Trade complete — funds released',
        title: 'Trade Completed',
        message: 'Congratulations! The trade has been completed and USDT has been released to your wallet.',
        actionLabel: 'View Wallet',
        urgency: 'medium',
      },
      TRADE_CANCELLED: {
        subject: '❌ Trade cancelled',
        title: 'Trade Cancelled',
        message: 'The trade has been cancelled. Any locked USDT has been refunded to the seller.',
        actionLabel: 'View History',
        urgency: 'low',
      },
      DISPUTE_OPENED: {
        subject: '⚠️ Dispute opened on your trade',
        title: 'Dispute Opened',
        message: 'A dispute has been raised on one of your trades. Our support team will review and make a decision.',
        actionLabel: 'View Dispute',
        urgency: 'high',
      },
      DISPUTE_RESOLVED: {
        subject: '🎯 Dispute resolved',
        title: 'Dispute Resolved',
        message: 'The dispute on your trade has been reviewed and resolved by our support team.',
        actionLabel: 'View Resolution',
        urgency: 'medium',
      },
      KYC_APPROVED: {
        subject: '✅ KYC approved — you can now trade',
        title: 'KYC Approved',
        message: 'Your identity verification has been approved. You can now post ads and start trades.',
        actionLabel: 'Go to Marketplace',
        urgency: 'medium',
      },
      KYC_REJECTED: {
        subject: '❌ KYC submission rejected',
        title: 'KYC Rejected',
        message: 'Your KYC submission was not approved. Please submit again with clear, valid documents.',
        actionLabel: 'Resubmit KYC',
        urgency: 'high',
      },
      DEPOSIT_CONFIRMED: {
        subject: '✅ Deposit confirmed',
        title: 'Deposit Received',
        message: 'Your USDT deposit has been confirmed and is now in your wallet.',
        actionLabel: 'View Wallet',
        urgency: 'medium',
      },
      DEPOSIT_REJECTED: {
        subject: '❌ Deposit rejected',
        title: 'Deposit Rejected',
        message: 'Your deposit request was rejected. Please contact support for assistance.',
        actionLabel: 'Contact Support',
        urgency: 'high',
      },
      WITHDRAWAL_CONFIRMED: {
        subject: '✅ Withdrawal sent',
        title: 'Withdrawal Processed',
        message: 'Your USDT withdrawal has been sent to your wallet. It should arrive within a few minutes.',
        actionLabel: 'View Transaction',
        urgency: 'medium',
      },
      WITHDRAWAL_REJECTED: {
        subject: '❌ Withdrawal rejected',
        title: 'Withdrawal Rejected',
        message: 'Your withdrawal request was rejected. Please contact support for more information.',
        actionLabel: 'Contact Support',
        urgency: 'high',
      },
    };
    return templates[type] || {
      subject: 'Birrly Notification',
      title: 'Update',
      message: 'You have a new notification.',
      urgency: 'low',
    };
  }

  getHtmlEmailTemplate(
    type: string,
    tradeId?: string,
    customMessage?: string,
  ): string {
    const template = this.getTemplate(type);
    const appName = 'Birrly';
    const actionUrl = tradeId ? `${process.env.FRONTEND_URL}/trades/${tradeId}` : `${process.env.FRONTEND_URL}`;

    const urgencyColor = {
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#6b7280',
    }[template.urgency];

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="border-bottom: 3px solid ${urgencyColor}; padding-bottom: 20px; margin-bottom: 30px;">
      <h2 style="margin: 0; color: #1f2937;">${appName}</h2>
    </div>

    <!-- Content -->
    <div style="margin-bottom: 30px;">
      <h3 style="color: ${urgencyColor}; margin-top: 0;">${template.title}</h3>
      <p style="font-size: 16px; color: #4b5563;">${customMessage || template.message}</p>
    </div>

    <!-- CTA Button -->
    ${template.actionLabel && template.actionUrl ? `
    <div style="margin-bottom: 30px;">
      <a href="${actionUrl}" style="display: inline-block; background-color: ${urgencyColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        ${template.actionLabel}
      </a>
    </div>
    ` : ''}

    <!-- Footer -->
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #9ca3af;">
      <p style="margin: 0 0 10px 0;">
        You're receiving this email because you enabled notifications for this type of activity in your ${appName} account.
      </p>
      <p style="margin: 0;">
        © ${new Date().getFullYear()} ${appName}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}
