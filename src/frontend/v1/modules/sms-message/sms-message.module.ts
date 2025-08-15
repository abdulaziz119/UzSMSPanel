import { Module } from '@nestjs/common';
import { SmsMessageController } from './sms-message.controller';
import { SmsMessageService } from '../../../../service/sms-message.service';
import { DatabaseModule } from '../../../../database/database.module';
import { smsMessageProviders } from '../../../../providers/sms-message.providers';
import { userProviders } from '../../../../providers/user.providers';
import { smsContactProviders } from '../../../../providers/sms-contact.providers';
import { tariffsProviders } from '../../../../providers/tariffs.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [SmsMessageController],
  providers: [
    ...smsMessageProviders,
    ...userProviders,
    ...smsContactProviders,
    ...tariffsProviders,
    SmsMessageService,
  ],
})
export class SmsMessageModule {}
