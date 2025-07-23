import { DataSource } from 'typeorm';
import { WebhooksEntity } from '../entity/webhooks.entity';

export const webhooksProviders = [
  {
    provide: 'WEBHOOKS_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(WebhooksEntity),
    inject: ['DATA_SOURCE'],
  },
];
