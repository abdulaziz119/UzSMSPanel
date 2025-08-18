import { Module } from '@nestjs/common';
import { SmsMessageController } from './sms-message.controller';
import { SmsMessageService } from '../../../../service/sms-message.service';
import { DatabaseModule } from '../../../../database/database.module';
import { smsMessageProviders } from '../../../../providers/sms-message.providers';
import { userProviders } from '../../../../providers/user.providers';
import { smsContactProviders } from '../../../../providers/sms-contact.providers';
import { tariffsProviders } from '../../../../providers/tariffs.providers';
import { SmsContactModule } from '../../../../frontend/v1/modules/sms-contact/sms-contact.module';
import { smsGroupProviders } from '../../../../providers/sms-group.providers';
import { smsTemplateProviders } from '../../../../providers/sms-template.providers';
import { BillingService } from '../../../../service/billing.service';
import { SmsContactService } from '../../../../service/sms-contact.service';

@Module({
  imports: [DatabaseModule, SmsContactModule],
  controllers: [SmsMessageController],
  providers: [
    ...smsMessageProviders,
    ...userProviders,
    ...smsContactProviders,
  ...smsGroupProviders,
  ...smsTemplateProviders,
    ...tariffsProviders,
  SmsContactService,
  BillingService,
    SmsMessageService,
  ],
})
export class SmsMessageDashboardModule {}
