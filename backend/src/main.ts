console.log('BOOT: script started');

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('BOOT: creating app');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  console.log('BOOT: app created');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });
  const port = process.env.PORT ?? 4000;
  console.log('BOOT: about to listen on port', port);
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}
bootstrap().catch((err) => {
  console.error('BOOTSTRAP FAILED:', err);
});
