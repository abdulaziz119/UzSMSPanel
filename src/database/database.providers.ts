import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { UZ_SMS_PANEL } from '../constants/constants';
import {
  DB_DB,
  DB_HOST,
  DB_PASS,
  DB_PORT,
  DB_SCHEMA,
  DB_USER,
} from '../utils/env/env';
import { UserEntity } from '../entity/user.entity';
import { TransactionsEntity } from '../entity/transactions.entity';
import { TariffEntity } from '../entity/tariffs.entity';
import { SmsMessagesEntity } from '../entity/sms-messages.entity';
import { MessageTemplatesEntity } from '../entity/message-templates.entity';
import { OtpEntity } from '../entity/otps.entity';

export const databaseProviders = [
  {
    provide: UZ_SMS_PANEL,
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'postgres',
        host: DB_HOST,
        port: DB_PORT,
        username: DB_USER,
        password: DB_PASS,
        database: DB_DB,
        synchronize: false,
        logging: false,
        schema: DB_SCHEMA,
        entities: [
          UserEntity,
          TransactionsEntity,
          TariffEntity,
          SmsMessagesEntity,
          MessageTemplatesEntity,
          OtpEntity,
        ],
        // extra: {
        //   timezone: 'UTC',
        // },
      });
      await dataSource.initialize();
      return dataSource;
    },
  },
];
