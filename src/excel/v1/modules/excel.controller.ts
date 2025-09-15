
import { Controller, Post, Body } from '@nestjs/common';
import { ExcelService } from './excel.service';

@Controller('excel')
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}

  @Post('process')
  processExcel(@Body() data: { filePath: string; userId: number }) {
    return this.excelService.processExcel(data.filePath, data.userId);
  }
}
