import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../../database/database.module';
import { SmsContactController } from './sms-contact.controller';
import { SmsContactService } from '../../../../service/sms-contact.service';
import { smsContactProviders } from '../../../../providers/sms-contact.providers';
import { tariffsProviders } from '../../../../providers/tariffs.providers';
import { groupProviders } from '../../../../providers/group.providers';
import { SmsContactQueue } from '../../../../queue/sms-contact.queue';

@Module({
  imports: [
    DatabaseModule,
  ],
  controllers: [SmsContactController],
  providers: [
    ...smsContactProviders,
    ...tariffsProviders,
    ...groupProviders,
    SmsContactService,
    SmsContactQueue,
  ],
  exports: [SmsContactService, ...smsContactProviders, ...tariffsProviders],
})
export class SmsContactModule {}
