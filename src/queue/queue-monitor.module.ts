import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SMS_MESSAGE_QUEUE, SMS_CONTACT_QUEUE } from '../constants/constants';
import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } from '../utils/env/env';

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: REDIS_HOST,
        port: Number(REDIS_PORT),
        password: REDIS_PASSWORD || undefined,
      },
    }),
    BullModule.registerQueue(
      {
        name: SMS_MESSAGE_QUEUE,
      },
      {
        name: SMS_CONTACT_QUEUE,
      },
    ),
  ],
  exports: [BullModule],
})
export class QueueMonitorModule {}
