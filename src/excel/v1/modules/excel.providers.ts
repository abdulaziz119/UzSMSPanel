import { DataSource } from 'typeorm';
import { ExcelEntity } from '../../../entity/excel.entity';
import { MODELS, UZ_SMS_PANEL } from '../../../constants/constants';

export const excelProviders = [
  {
    provide: MODELS.EXCEL,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(ExcelEntity),
    inject: [UZ_SMS_PANEL],
  },
];
