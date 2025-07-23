import { DataSource } from 'typeorm';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';
import { SenderIdsEntity } from '../entity/sender-ids.entity';

export const senderIdsProviders = [
  {
    provide: MODELS.SENDER_IDS,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(SenderIdsEntity),
    inject: [UZ_SMS_PANEL],
  },
];
