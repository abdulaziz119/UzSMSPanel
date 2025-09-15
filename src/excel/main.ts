import { NestFactory } from '@nestjs/core';
import { AppExcelModule } from './app.module';
import * as bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';
import { EXCEL_PORT } from '../utils/env/env';

async function bootstrap() {
  const app = await NestFactory.create(AppExcelModule);

  app.setGlobalPrefix('api');
  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(EXCEL_PORT);
  console.log('✅ Excel servisi muvaffaqiyatli ishga tushdi!');
}

bootstrap().then(() => {
  console.log('═══════════════════════════════════════════════════════');
  console.log(`🌐 EXCEL API: http://0.0.0.0:${EXCEL_PORT}`);
  console.log('═══════════════════════════════════════════════════════');
});
