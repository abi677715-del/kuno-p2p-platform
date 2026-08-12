import { Injectable, Logger } from '@nestjs/common';
import * as webpush from 'web-push';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private enabled = false;

  constructor(private prisma: PrismaService) {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (publicKey && privateKey) {
      webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:support@birrly.net', publicKey, privateKey);
      this.enabled = true;
    } else {
      this.logger.warn('VAPID keys not set — web push notifications are disabled');
    }
  }

  getPublicKey() {
    return { publicKey: process.env.VAPID_PUBLIC_KEY ?? null };
  }

  async subscribe(userId: string, sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      create: { userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      update: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });
    return { ok: true };
  }

  async unsubscribe(endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { endpoint } });
    return { ok: true };
  }

  /** Best-effort — a user with no subscriptions or an expired/misconfigured setup should never break the caller's flow. */
  async notify(userId: string, payload: { title: string; body: string; url?: string }) {
    if (!this.enabled) return;
    const subs = await this.prisma.pushSubscription.findMany({ where: { userId } });
    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload),
          );
        } catch (err: any) {
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          } else {
            this.logger.warn(`Push send failed: ${err?.message ?? err}`);
          }
        }
      }),
    );
  }
}
