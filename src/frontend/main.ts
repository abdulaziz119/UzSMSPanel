import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import { FRONTEND_PORT } from '../utils/env/env';
import { ModulesFrontendModule } from './v1/modules/modules.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(
    ModulesFrontendModule,
  );

  app.enableCors();

  app.use(cookieParser());

  app.use(
    bodyParser.json({
      limit: '50mb',
    }),
  );
  app.use(
    bodyParser.urlencoded({
      limit: '50mb',
      extended: true,
    }),
  );

  app.disable('etag');
  app.disable('x-powered-by');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const options = new DocumentBuilder()
    .setTitle('Frontend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.setGlobalPrefix('api');
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api/v1/swagger', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(FRONTEND_PORT);
  console.log('✅ Frontend servisi muvaffaqiyatli ishga tushdi!');
}

bootstrap().then((): void => {
  console.log(`Frontend API: http://0.0.0.0:${FRONTEND_PORT}/api/v1/swagger`);
});
