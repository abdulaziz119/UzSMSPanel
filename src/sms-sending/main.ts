import { NestFactory } from '@nestjs/core';
import { AppSmsSendingModule } from './app.module';
import * as bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';
import { SMS_SENDING_PORT } from '../utils/env/env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppSmsSendingModule);

  app.setGlobalPrefix('api');
  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(SMS_SENDING_PORT);
  console.log('✅ SMS Sending servisi muvaffaqiyatli ishga tushdi!');
}

bootstrap().then(() => {
  console.log('═══════════════════════════════════════════════════════');
  console.log(`🌐 EXCEL API: http://0.0.0.0:${SMS_SENDING_PORT}`);
  console.log('═══════════════════════════════════════════════════════');
});
