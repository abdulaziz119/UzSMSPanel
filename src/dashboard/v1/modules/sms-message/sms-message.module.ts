import { Module } from '@nestjs/common';
import { SmsMessageController } from './sms-message.controller';
import { SmsMessageService } from '../../../../service/sms-message.service';
import { DatabaseModule } from '../../../../database/database.module';
import { smsMessageProviders } from '../../../../providers/sms-message.providers';
import { userProviders } from '../../../../providers/user.providers';
import { smsContactProviders } from '../../../../providers/sms-contact.providers';
import { tariffsProviders } from '../../../../providers/tariffs.providers';
import { SmsContactModule } from '../../../../frontend/v1/modules/sms-contact/sms-contact.module';
import { smsTemplateProviders } from '../../../../providers/sms-template.providers';

@Module({
  imports: [DatabaseModule, SmsContactModule],
  controllers: [SmsMessageController],
  providers: [
    ...smsMessageProviders,
    ...userProviders,
    ...smsContactProviders,
  ...smsTemplateProviders,
    ...tariffsProviders,
    SmsMessageService,
  ],
})
export class SmsMessageDashboardModule {}
