import { DataSource } from 'typeorm';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';
import { TransactionsEntity } from '../entity/transactions.entity';

export const transactionsProviders = [
  {
    provide: MODELS.TRANSACTIONS,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(TransactionsEntity),
    inject: [UZ_SMS_PANEL],
  },
];
