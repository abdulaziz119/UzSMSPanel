import { DataSource } from 'typeorm';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';
import { SmsGroupEntity } from '../entity/sms-group.entity';

export const smsGroupProviders = [
  {
    provide: MODELS.SMS_GROUP,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(SmsGroupEntity),
    inject: [UZ_SMS_PANEL],
  },
];