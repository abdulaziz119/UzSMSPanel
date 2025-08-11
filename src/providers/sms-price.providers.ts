import { DataSource } from 'typeorm';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';
import { SmsPriceEntity } from '../entity/sms-price.entity';

export const smsPriceProviders = [
  {
    provide: MODELS.SMS_PRICE,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(SmsPriceEntity),
    inject: [UZ_SMS_PANEL],
  },
];