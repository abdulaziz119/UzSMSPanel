import { Module } from '@nestjs/common';
import { SmsSendingController } from './sms-sending.controller';
import { MessageService } from '../../../../service/message.service';
import { SmsSendingService } from '../../../../service/sms-sending.service';
import { messageProviders } from '../../../../providers/message.providers';
import { userProviders } from '../../../../providers/user.providers';
import { smsContactProviders } from '../../../../providers/sms-contact.providers';
import { contactProviders } from '../../../../providers/contact.providers';
import { smsTemplateProviders } from '../../../../providers/sms-template.providers';
import { DatabaseModule } from '../../../../database/database.module';
import { groupProviders } from '../../../../providers/group.providers';
import { tariffsProviders } from '../../../../providers/tariffs.providers';
import { BillingService } from '../../../../service/billing.service';
import { SmsContactService } from '../../../../service/sms-contact.service';
import { PerformanceMonitor } from '../../../../utils/performance-monitor.util';
import { MessagesQueue } from '../../../../queue/messages.queue';
import { MobiUzSmppService } from '../../../../service/mobi-uz.smpp.service';
import { AxiosModule } from '../../../../helpers/axios.module';

@Module({
  imports: [DatabaseModule, AxiosModule],
  controllers: [SmsSendingController],
  providers: [
    ...messageProviders,
    ...userProviders,
    ...contactProviders,
    ...smsContactProviders,
    ...tariffsProviders,
    ...smsTemplateProviders,
    ...groupProviders,
    SmsContactService,
    BillingService,
    PerformanceMonitor,
    MessageService,
    SmsSendingService,
    MobiUzSmppService,
    // queue processor
    MessagesQueue,
  ],
})
export class SmsSendingModule {}
