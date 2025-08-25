import { DataSource } from 'typeorm';
import { EmailSmtpEntity } from '../entity/email-smtp.entity';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';

export const emailSmtpProviders = [
  {
    provide: MODELS.EMAIL_SMTP,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(EmailSmtpEntity),
    inject: [UZ_SMS_PANEL],
  },
];
