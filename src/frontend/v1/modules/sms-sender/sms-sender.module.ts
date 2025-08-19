import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../../database/database.module';
import { SmsSenderController } from './sms-sender.controller';
import { SmsSenderService } from '../../../../service/sms-sender.service';
import { smsSenderProviders } from '../../../../providers/sms-sender.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [SmsSenderController],
  providers: [SmsSenderService, ...smsSenderProviders],
})
export class SmsSenderModule {}
