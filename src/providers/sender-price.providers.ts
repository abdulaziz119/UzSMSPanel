import { DataSource } from 'typeorm';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';
import { SenderPriceEntity } from '../entity/sender-price.entity';

export const senderPriceProviders = [
  {
    provide: MODELS.SENDER_PRICE,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(SenderPriceEntity),
    inject: [UZ_SMS_PANEL],
  },
];
