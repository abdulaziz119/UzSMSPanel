import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { excelProviders } from '../../../providers/excel.providers';
import { ExcelService } from '../../../service/excel.service';
import { ExcelController } from './excel.controller';
import { contactProviders } from '../../../providers/contact.providers';
import { userProviders } from '../../../providers/user.providers';
import { QueueMonitorModule } from '../../../queue/queue-monitor.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ExcelController],
  providers: [
    ...excelProviders,
    ...contactProviders,
    ...userProviders,
    ExcelService,
    QueueMonitorModule,
  ],
})
export class ExcelModule {}
