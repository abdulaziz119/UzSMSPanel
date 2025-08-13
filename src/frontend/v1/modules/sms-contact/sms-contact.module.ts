import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../../database/database.module';
import { SmsContactController } from './sms-contact.controller';
import { SmsContactService } from '../../../../service/sms-contact.service';
import { smsContactProviders } from '../../../../providers/sms-contact.providers';
import { tariffsProviders } from '../../../../providers/tariffs.providers';

@Module({
  imports: [DatabaseModule],

  controllers: [SmsContactController],
  providers: [...smsContactProviders, ...tariffsProviders, SmsContactService],
})
export class SmsContactModule {}
