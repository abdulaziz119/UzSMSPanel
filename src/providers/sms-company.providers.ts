import { DataSource } from 'typeorm';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';
import { SmsCompanyEntity } from '../entity/sms-company.entity';

export const smsCompanyProviders = [
  {
    provide: MODELS.SMS_COMPANY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(SmsCompanyEntity),
    inject: [UZ_SMS_PANEL],
  },
];