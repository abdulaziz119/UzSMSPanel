import { DataSource } from 'typeorm';
import { ApiLogsEntity } from '../entity/api-logs.entity';

export const apiLogsProviders = [
  {
    provide: 'API_LOGS_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(ApiLogsEntity),
    inject: ['DATA_SOURCE'],
  },
];