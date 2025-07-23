import { DataSource } from 'typeorm';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';
import { MessageTemplatesEntity } from '../entity/message-templates.entity';

export const messageTemplatesProviders = [
  {
    provide: MODELS.MESSAGE_TEMPLATES,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(MessageTemplatesEntity),
    inject: [UZ_SMS_PANEL],
  },
];
