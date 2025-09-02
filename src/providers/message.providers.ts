import { DataSource } from 'typeorm';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';
import { MessageEntity } from '../entity/message.entity';

export const messageProviders = [
  {
    provide: MODELS.MESSAGE,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(MessageEntity),
    inject: [UZ_SMS_PANEL],
  },
];
