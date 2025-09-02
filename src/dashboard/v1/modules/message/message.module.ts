import { Module } from '@nestjs/common';
import { MessageController } from './message.controller';
import { MessageService } from '../../../../service/message.service';
import { DatabaseModule } from '../../../../database/database.module';
import { messageProviders } from '../../../../providers/message.providers';
import { userProviders } from '../../../../providers/user.providers';
import { smsContactProviders } from '../../../../providers/sms-contact.providers';
import { tariffsProviders } from '../../../../providers/tariffs.providers';
import { SmsContactModule } from '../../../../frontend/v1/modules/sms-contact/sms-contact.module';
import { groupProviders } from '../../../../providers/group.providers';
import { smsTemplateProviders } from '../../../../providers/sms-template.providers';
import { BillingService } from '../../../../service/billing.service';
import { SmsContactService } from '../../../../service/sms-contact.service';
import { PerformanceMonitor } from '../../../../utils/performance-monitor.util';
import { contactProviders } from '../../../../providers/contact.providers';

@Module({
  imports: [DatabaseModule, SmsContactModule],
  controllers: [MessageController],
  providers: [
    ...messageProviders,
    ...userProviders,
    ...smsContactProviders,
    ...groupProviders,
    ...smsTemplateProviders,
    ...tariffsProviders,
    ...contactProviders,
    SmsContactService,
    BillingService,
    PerformanceMonitor,
    MessageService,
  ],
})
export class SmsMessageDashboardModule {}
