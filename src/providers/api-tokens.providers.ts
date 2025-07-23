import { DataSource } from 'typeorm';
import { ApiTokensEntity } from '../entity/api-tokens.entity';

export const apiTokensProviders = [
  {
    provide: 'API_TOKENS_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(ApiTokensEntity),
    inject: ['DATA_SOURCE'],
  },
];
