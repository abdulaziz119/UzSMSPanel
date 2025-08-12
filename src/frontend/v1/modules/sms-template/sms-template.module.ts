import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../../database/database.module';
import { SmsTemplateController } from './sms-template.controller';
import { SmsTemplateService } from '../../../../service/sms-template.service';
import { smsTemplateProviders } from '../../../../providers/sms-template.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [SmsTemplateController],
  providers: [SmsTemplateService, ...smsTemplateProviders],
  exports: [SmsTemplateService],
})
export class SmsTemplateModule {}
