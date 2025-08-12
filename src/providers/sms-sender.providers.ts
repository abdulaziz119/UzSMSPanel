import { DataSource } from 'typeorm';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';
import { SmsSenderEntity } from '../entity/sms-sender.entity';

export const smsSenderProviders = [
  {
    provide: MODELS.SMS_SENDER,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(SmsSenderEntity),
    inject: [UZ_SMS_PANEL],
  },
];
