import { DataSource } from 'typeorm';
import { EmailGroupEntity } from '../entity/email-group.entity';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';

export const emailGroupProviders = [
  {
    provide: MODELS.EMAIL_GROUP,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(EmailGroupEntity),
    inject: [UZ_SMS_PANEL],
  },
];
