import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../../database/database.module';
import { excelProviders } from '../../../../providers/excel.providers';
import { ExcelService } from '../../../../service/excel.service';
import { ExcelController } from './excel.controller';
import { contactProviders } from '../../../../providers/contact.providers';
import { userProviders } from '../../../../providers/user.providers';
import { QueueMonitorModule } from '../../../../queue/queue-monitor.module';
import { SmsContactQueue } from '../../../../queue/sms-contact.queue';
import { SmsContactService } from '../../../../service/sms-contact.service';
import { smsContactProviders } from '../../../../providers/sms-contact.providers';
import { tariffsProviders } from '../../../../providers/tariffs.providers';
import { groupProviders } from '../../../../providers/group.providers';

@Module({
  imports: [DatabaseModule, QueueMonitorModule],
  controllers: [ExcelController],
  providers: [
    ...excelProviders,
    ...contactProviders,
    ...userProviders,
    ...smsContactProviders,
    ...tariffsProviders,
    ...groupProviders,
    ExcelService,
    SmsContactService,
    SmsContactQueue,
  ],
})
export class ExcelModule {}
