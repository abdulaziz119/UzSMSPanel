import { DataSource } from 'typeorm';
import { ApiTokensEntity } from '../entity/api-tokens.entity';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';

export const apiTokensProviders = [
  {
    provide: MODELS.API_TOKENS,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(ApiTokensEntity),
    inject: [UZ_SMS_PANEL],
  },
];
