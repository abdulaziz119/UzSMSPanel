import { Module } from '@nestjs/common';
import { ExcelService } from '../../../../service/excel.service';
import { AxiosModule } from '../../../../helpers/axios.module';
import { excelProviders } from '../../../../providers/excel.providers';
import { DatabaseModule } from '../../../../database/database.module';
import { userProviders } from '../../../../providers/user.providers';
import { contactProviders } from '../../../../providers/contact.providers';
import { ExcelController } from './excel.controller';

@Module({
  imports: [DatabaseModule, AxiosModule],
  controllers: [ExcelController],
  providers: [
    ...excelProviders,
    ...userProviders,
    ...contactProviders,
    ExcelService,
  ],
})
export class ExcelModule {}
