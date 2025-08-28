import { Module } from '@nestjs/common';
import { SmsMessageController } from './sms-message.controller';
import { SmsMessageService } from '../../../../service/sms-message.service';
import { DatabaseModule } from '../../../../database/database.module';
import { smsMessageProviders } from '../../../../providers/sms-message.providers';
import { userProviders } from '../../../../providers/user.providers';
import { smsContactProviders } from '../../../../providers/sms-contact.providers';
import { tariffsProviders } from '../../../../providers/tariffs.providers';
import { smsTemplateProviders } from '../../../../providers/sms-template.providers';
import { groupProviders } from '../../../../providers/group.providers';
import { SmsContactModule } from '../sms-contact/sms-contact.module';
import { BillingService } from '../../../../service/billing.service';
import { SmsContactService } from '../../../../service/sms-contact.service';
import { PerformanceMonitor } from '../../../../utils/performance-monitor.util';
import { contactProviders } from '../../../../providers/contact.providers';

@Module({
  imports: [DatabaseModule, SmsContactModule],
  controllers: [SmsMessageController],
  providers: [
    ...smsMessageProviders,
    ...userProviders,
    ...smsTemplateProviders,
    ...groupProviders,
    ...smsContactProviders,
    ...tariffsProviders,
    ...contactProviders,
    SmsContactService,
    BillingService,
    PerformanceMonitor,
    SmsMessageService,
  ],
})
export class SmsMessageModule {}
