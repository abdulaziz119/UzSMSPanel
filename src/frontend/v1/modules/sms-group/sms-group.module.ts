import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../../database/database.module';
import { SmsGroupController } from './sms-group.controller';
import { SmsGroupService } from '../../../../service/sms-group.service';
import { smsGroupProviders } from '../../../../providers/sms-group.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [SmsGroupController],
  providers: [...smsGroupProviders, SmsGroupService],
})
export class SmsGroupModule {}
