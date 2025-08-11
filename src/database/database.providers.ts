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
import { ApiKeyEntity } from '../entity/api-key.entity';
import { BalanceTransactionEntity } from '../entity/balance-transaction.entity';
import { ContactEntity } from '../entity/contact.entity';
import { OtpEntity } from '../entity/otp.entity';
import { SmsCampaignEntity } from '../entity/sms-campaign.entity';
import { SmsCompanyEntity } from '../entity/sms-company.entity';
import { SmsContactEntity } from '../entity/sms-contact.entity';
import { SmsGroupEntity } from '../entity/sms-group.entity';
import { SmsPriceEntity } from '../entity/sms-price.entity';
import { TariffEntity } from '../entity/tariffs.entity';
import { UserEntity } from '../entity/user.entity';

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
        synchronize: true,
        logging: false,
        schema: DB_SCHEMA,
        entities: [
          ApiKeyEntity,
          BalanceTransactionEntity,
          ContactEntity,
          OtpEntity,
          SmsCampaignEntity,
          SmsCompanyEntity,
          SmsContactEntity,
          SmsGroupEntity,
          SmsPriceEntity,
          SmsTransactionEntity,
          TariffEntity,
          UserEntity,
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
