import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { SmsMessageService } from '../../../../service/sms-message.service';
import { smsMessageProviders } from '../../../../providers/sms-message.providers';
import { userProviders } from '../../../../providers/user.providers';
import { smsContactProviders } from '../../../../providers/sms-contact.providers';
import { smsTemplateProviders } from '../../../../providers/sms-template.providers';
import { DatabaseModule } from '../../../../database/database.module';
import { MessagesService } from '../../../../service/messages.service';
import { SmsContactModule } from '../sms-contact/sms-contact.module';
import { smsGroupProviders } from '../../../../providers/sms-group.providers';
import { BillingService } from '../../../../service/billing.service';
import { SmsContactService } from '../../../../service/sms-contact.service';
import { CacheModule } from '../../../../utils/cache/cache.module';
import { PerformanceMonitor } from '../../../../utils/performance-monitor.util';

@Module({
  imports: [DatabaseModule, SmsContactModule, CacheModule],
  controllers: [MessagesController],
  providers: [
    ...smsMessageProviders,
    ...userProviders,
    ...smsContactProviders,
    ...smsTemplateProviders,
    ...smsGroupProviders,
    SmsContactService,
    BillingService,
    PerformanceMonitor,
    SmsMessageService,
    // frontend wrapper service
    MessagesService,
  ],
})
export class MessagesModule {}
