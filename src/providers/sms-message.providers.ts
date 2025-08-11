import { DataSource } from 'typeorm';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';
import { SmsMessageEntity } from '../entity/sms-message.entity';

export const smsMessageProviders = [
  {
    provide: MODELS.SMS_MESSAGE,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(SmsMessageEntity),
    inject: [UZ_SMS_PANEL],
  },
];