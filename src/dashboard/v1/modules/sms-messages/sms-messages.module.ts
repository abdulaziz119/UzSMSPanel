import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../../database/database.module';
import { SmsMessagesController } from './dashboard-sms-messages.controller';
import { SmsMessagesService } from '../../../../service/sms-messages.service';
import { smsMessagesProviders } from '../../../../providers/sms-messages.providers';
import { userProviders } from '../../../../providers/user.providers';
import { tariffsProviders } from '../../../../providers/tariffs.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [SmsMessagesController],
  providers: [
    ...smsMessagesProviders,
    ...userProviders,
    ...tariffsProviders,
    SmsMessagesService,
  ],
  exports: [SmsMessagesService],
})
export class SmsMessagesModule {}
