import { DataSource } from 'typeorm';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';
import { SmsMessagesEntity } from '../entity/sms-messages.entity';

export const smsMessagesProviders = [
  {
    provide: MODELS.SMS_MESSAGES,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(SmsMessagesEntity),
    inject: [UZ_SMS_PANEL],
  },
];
