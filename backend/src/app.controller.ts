import { Controller, Get } from '@nestjs/common';

/** Unauthenticated status check for uptime monitoring — no auth guard on purpose. */
@Controller()
export class AppController {
  @Get('health')
  health() {
    return { status: 'ok', time: new Date().toISOString() };
  }
}
