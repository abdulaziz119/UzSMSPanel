import { DataSource } from 'typeorm';
import { EmailTemplateEntity } from '../entity/email-template.entity';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';

export const emailTemplateProviders = [
  {
    provide: MODELS.EMAIL_TEMPLATE,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(EmailTemplateEntity),
    inject: [UZ_SMS_PANEL],
  },
];
