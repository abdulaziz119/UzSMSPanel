import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ExcelModule } from './modules/excel/excel.module';

@Module({
  imports: [DatabaseModule, ExcelModule],
})
export class ModulesExcelModule {}
