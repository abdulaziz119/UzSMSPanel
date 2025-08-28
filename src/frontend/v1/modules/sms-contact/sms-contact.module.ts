import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { DatabaseModule } from '../../../../database/database.module';
import { SmsContactController } from './sms-contact.controller';
import { SmsContactService } from '../../../../service/sms-contact.service';
import { smsContactProviders } from '../../../../providers/sms-contact.providers';
import { tariffsProviders } from '../../../../providers/tariffs.providers';
import { groupProviders } from '../../../../providers/group.providers';
import { SmsContactQueue } from '../../../../queue/sms-contact.queue';
import { REDIS_HOST, REDIS_PORT } from '../../../../utils/env/env';
import { SMS_CONTACT_QUEUE } from '../../../../constants/constants';

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
      name: SMS_CONTACT_QUEUE,
    }),
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
