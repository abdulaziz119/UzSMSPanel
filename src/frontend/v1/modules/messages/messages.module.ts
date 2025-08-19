import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MessagesController } from './messages.controller';
import { SmsMessageService } from '../../../../service/sms-message.service';
import { MessagesService } from '../../../../service/messages.service';
import { smsMessageProviders } from '../../../../providers/sms-message.providers';
import { userProviders } from '../../../../providers/user.providers';
import { smsContactProviders } from '../../../../providers/sms-contact.providers';
import { contactProviders } from '../../../../providers/contact.providers';
import { smsTemplateProviders } from '../../../../providers/sms-template.providers';
import { DatabaseModule } from '../../../../database/database.module';
import { smsGroupProviders } from '../../../../providers/sms-group.providers';
import { tariffsProviders } from '../../../../providers/tariffs.providers';
import { BillingService } from '../../../../service/billing.service';
import { SmsContactService } from '../../../../service/sms-contact.service';
import { PerformanceMonitor } from '../../../../utils/performance-monitor.util';
import { MessagesQueue } from '../../../../queue/messages.queue';
import { SMS_MESSAGE_QUEUE } from '../../../../constants/constants';
import { REDIS_HOST, REDIS_PORT } from '../../../../utils/env/env';

@Module({
  imports: [
    DatabaseModule,
    BullModule.forRoot({
      redis: {
        host: REDIS_HOST,
        port: Number(REDIS_PORT),
      },
    }),
    BullModule.registerQueue({
      name: SMS_MESSAGE_QUEUE,
    }),
  ],
  controllers: [MessagesController],
  providers: [
    ...smsMessageProviders,
    ...userProviders,
  ...contactProviders,
    ...smsContactProviders,
    ...tariffsProviders,
    ...smsTemplateProviders,
    ...smsGroupProviders,
    SmsContactService,
    BillingService,
    PerformanceMonitor,
    SmsMessageService,
  MessagesService,
    // queue processor
    MessagesQueue,
  ],
})
export class MessagesModule {}
