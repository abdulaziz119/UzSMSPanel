import { Module } from '@nestjs/common';
import { EmailTemplateService } from '../../../../service/email-template.service';
import { EmailTemplateController } from './email-template.controller';
import { emailTemplateProviders } from '../../../../providers/email-template.providers';
import { DatabaseModule } from '../../../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [EmailTemplateController],
  providers: [EmailTemplateService, ...emailTemplateProviders],
  exports: [EmailTemplateService],
})
export class EmailTemplateModule {}
