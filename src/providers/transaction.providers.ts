import { DataSource } from 'typeorm';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';
import { TransactionEntity } from '../entity/transaction.entity';

export const transactionProviders = [
  {
    provide: MODELS.TRANSACTION,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(TransactionEntity),
    inject: [UZ_SMS_PANEL],
  },
];
