import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { SmsMessageService } from '../../../../service/sms-message.service';
import { smsMessageProviders } from '../../../../providers/sms-message.providers';
import { userProviders } from '../../../../providers/user.providers';
import { smsContactProviders } from '../../../../providers/sms-contact.providers';
import { DatabaseModule } from '../../../../database/database.module';
import { MessagesService } from '../../../../service/messages.service';

@Module({
  imports: [DatabaseModule],
  controllers: [MessagesController],
  providers: [
    ...smsMessageProviders,
    ...userProviders,
    ...smsContactProviders,
    SmsMessageService,
    // frontend wrapper service
    MessagesService,
  ],
})
export class MessagesModule {}
