import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { EmailTemplateService } from '../../../../service/email-template.service';
import { EmailTemplateController } from './email-template.controller';
import { emailTemplateProviders } from '../../../../providers/email-template.providers';
import { DatabaseModule } from '../../../../database/database.module';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Module({
  imports: [DatabaseModule],
  controllers: [EmailTemplateController],
  providers: [EmailTemplateService, ...emailTemplateProviders],
})
export class EmailTemplateModule {}
