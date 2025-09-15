import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { excelProviders } from './excel.providers';
import { ExcelService } from './excel.service';
import { ExcelController } from './excel.controller';
import { contactProviders } from '../../../providers/contact.providers';
import { userProviders } from '../../../providers/user.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [ExcelController],
  providers: [
    ...excelProviders,
    ...contactProviders,
    ...userProviders,
    ExcelService,
  ],
})
export class ExcelModule {}
