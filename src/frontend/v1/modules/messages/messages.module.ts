import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { SmsMessageService } from '../../../../service/sms-message.service';
import { smsMessageProviders } from '../../../../providers/sms-message.providers';
import { userProviders } from '../../../../providers/user.providers';
import { smsContactProviders } from '../../../../providers/sms-contact.providers';
import { smsTemplateProviders } from '../../../../providers/sms-template.providers';
import { DatabaseModule } from '../../../../database/database.module';
import { MessagesService } from '../../../../service/messages.service';
import { tariffsProviders } from '../../../../providers/tariffs.providers';
import { SmsContactModule } from '../sms-contact/sms-contact.module';
import { smsGroupProviders } from '../../../../providers/sms-group.providers';
import { BillingService } from '../../../../service/billing.service';
import { SmsContactService } from '../../../../service/sms-contact.service';
import { BullModule } from '@nestjs/bull';
import { REDIS_HOST, REDIS_PORT } from '../../../../utils/env/env';
import { SMS_MESSAGE_QUEUE } from '../../../../constants/constants';
import { SmsMessageQueue } from '../../../../queue/sms-message.queue';

@Module({
  imports: [
    DatabaseModule,
    SmsContactModule,
    BullModule.forRoot({
      redis: { host: REDIS_HOST, port: Number(REDIS_PORT) },
    }),
    BullModule.registerQueue({ name: SMS_MESSAGE_QUEUE }),
  ],
  controllers: [MessagesController],
  providers: [
    ...smsMessageProviders,
    ...userProviders,
    ...smsContactProviders,
    ...smsTemplateProviders,
    ...smsGroupProviders,
    SmsContactService,
    BillingService,
    SmsMessageService,
    // frontend wrapper service
    MessagesService,
    // queue processor
    SmsMessageQueue,
  ],
})
export class MessagesModule {}
