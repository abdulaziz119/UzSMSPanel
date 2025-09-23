import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { SmsSendingModule } from './sms-sending/sms-sending.module';
import { QueueMonitorModule } from '../../../queue/queue-monitor.module';

@Module({
  imports: [DatabaseModule, QueueMonitorModule, SmsSendingModule],
})
export class ModulesSmsSendingModule {}
