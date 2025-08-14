import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { DatabaseModule } from '../../../../database/database.module';
import { SmsContactController } from './sms-contact.controller';
import { SmsContactService } from '../../../../service/sms-contact.service';
import { smsContactProviders } from '../../../../providers/sms-contact.providers';
import { tariffsProviders } from '../../../../providers/tariffs.providers';
import { smsGroupProviders } from '../../../../providers/sms-group.providers';
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
    ...smsGroupProviders,
    SmsContactService,
    SmsContactQueue,
  ],
})
export class SmsContactModule implements OnModuleInit {
  private readonly logger = new Logger(SmsContactModule.name);

  onModuleInit() {
    this.logger.log(
      `🔗 Redis connection configured - Host: ${REDIS_HOST}, Port: ${REDIS_PORT}`,
    );
    this.logger.log(`📦 Queue registered - Name: ${SMS_CONTACT_QUEUE}`);
    this.logger.log(`✅ SMS Contact Module initialized successfully`);
  }
}
