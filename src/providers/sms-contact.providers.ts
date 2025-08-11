import { DataSource } from 'typeorm';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';
import { SmsContactEntity } from '../entity/sms-contact.entity';

export const smsContactProviders = [
  {
    provide: MODELS.SMS_CONTACT,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(SmsContactEntity),
    inject: [UZ_SMS_PANEL],
  },
];