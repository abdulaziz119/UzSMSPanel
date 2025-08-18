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

@Module({
  imports: [DatabaseModule, SmsContactModule],
  controllers: [MessagesController],
  providers: [
    ...smsMessageProviders,
    ...userProviders,
    ...smsContactProviders,
    ...smsTemplateProviders,
    ...tariffsProviders,
    SmsMessageService,
    // frontend wrapper service
    MessagesService,
  ],
})
export class MessagesModule {}
