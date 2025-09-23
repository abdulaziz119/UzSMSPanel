import { Module } from '@nestjs/common';
import { SmsSendingController } from './sms-sending.controller';
import { DatabaseModule } from '../../../database/database.module';
import { messageProviders } from '../../../providers/message.providers';
import { userProviders } from '../../../providers/user.providers';
import { groupProviders } from '../../../providers/group.providers';
import { contactProviders } from '../../../providers/contact.providers';
import { smsContactProviders } from '../../../providers/sms-contact.providers';
import { tariffsProviders } from '../../../providers/tariffs.providers';
import { smsTemplateProviders } from '../../../providers/sms-template.providers';
import { SmsContactService } from '../../../service/sms-contact.service';
import { BillingService } from '../../../service/billing.service';
import { PerformanceMonitor } from '../../../utils/performance-monitor.util';
import { MessageService } from '../../../service/message.service';
import { SmsSendingService } from '../../../service/sms-sending.service';
import { MobiUzSmppService } from '../../../service/mobi-uz.smpp.service';
import { MessagesQueue } from '../../../queue/messages.queue';

@Module({
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
  imports: [DatabaseModule],
  controllers: [SmsSendingController],
})
export class SmsSendingModule {}
