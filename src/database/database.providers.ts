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
import { TransactionEntity } from '../entity/transaction.entity';
import { ContactEntity } from '../entity/contact.entity';
import { OtpEntity } from '../entity/otp.entity';
import { SmsContactEntity } from '../entity/sms-contact.entity';
import { SmsGroupEntity } from '../entity/sms-group.entity';
import { SmsMessageEntity } from '../entity/sms-message.entity';
import { TariffEntity } from '../entity/tariffs.entity';
import { UserEntity } from '../entity/user.entity';
import { SmsTemplateEntity } from '../entity/sms-template.entity';
import { FileEntity } from '../entity/file.entity';
import { SmsSenderEntity } from '../entity/sms-sender.entity';
import { SenderPriceEntity } from '../entity/sender-price.entity';
import { CountryEntity } from '../entity/country.entity';

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
          TransactionEntity,
          ContactEntity,
          OtpEntity,
          SmsContactEntity,
          SmsGroupEntity,
          SmsMessageEntity,
          SmsTemplateEntity,
          SmsSenderEntity,
          SenderPriceEntity,
          TariffEntity,
          CountryEntity,
          UserEntity,
          FileEntity,
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
