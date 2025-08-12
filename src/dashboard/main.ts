import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DASHBOARD_PORT, MEDIA_DIRECTORY } from '../utils/env/env';
import { ModulesDashboardModule } from './v1/modules/modules.module';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    ModulesDashboardModule,
  );

  app.enableCors();

  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

  app.disable('etag');
  app.disable('x-powered-by');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const options = new DocumentBuilder()
    .setTitle('Dashboard API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.use(
    `/${MEDIA_DIRECTORY}`,
    express.static(path.resolve(process.cwd(), MEDIA_DIRECTORY)),
  );

  app.setGlobalPrefix('api');
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api/v1/swagger', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  await app.listen(DASHBOARD_PORT);
}

bootstrap().then(() =>
  console.log(`http://0.0.0.0:${DASHBOARD_PORT}/api/v1/swagger`),
);
