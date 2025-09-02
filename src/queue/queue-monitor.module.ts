import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SMS_MESSAGE_QUEUE, SMS_CONTACT_QUEUE } from '../constants/constants';
import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } from '../utils/env/env';
import { RedisHealthService } from '../service/redis-health.service';
import { QueueMonitorService } from '../service/queue-monitor.service';

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
  providers: [RedisHealthService, QueueMonitorService],
  exports: [RedisHealthService, QueueMonitorService, BullModule],
})
export class QueueMonitorModule {}
