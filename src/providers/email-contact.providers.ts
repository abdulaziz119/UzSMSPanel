import { DataSource } from 'typeorm';
import { EmailContactEntity } from '../entity/email-contact.entity';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';

export const emailContactProviders = [
  {
    provide: MODELS.EMAIL_CONTACT,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(EmailContactEntity),
    inject: [UZ_SMS_PANEL],
  },
];
