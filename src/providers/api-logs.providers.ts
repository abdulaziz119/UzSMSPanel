import { DataSource } from 'typeorm';
import { ApiLogsEntity } from '../entity/api-logs.entity';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';

export const apiLogsProviders = [
  {
    provide: MODELS.API_LOGS,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(ApiLogsEntity),
    inject: [UZ_SMS_PANEL],
  },
];
