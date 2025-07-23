import { DataSource } from 'typeorm';
import { WebhooksEntity } from '../entity/webhooks.entity';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';

export const webhooksProviders = [
  {
    provide: MODELS.WEBSOCKETS,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(WebhooksEntity),
    inject: [UZ_SMS_PANEL],
  },
];
