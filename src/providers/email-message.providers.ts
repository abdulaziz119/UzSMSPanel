import { DataSource } from 'typeorm';
import { EmailMessageEntity } from '../entity/email-message.entity';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';

export const emailMessageProviders = [
  {
    provide: MODELS.EMAIL_MESSAGE,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(EmailMessageEntity),
    inject: [UZ_SMS_PANEL],
  },
];
