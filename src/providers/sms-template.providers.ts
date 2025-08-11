import { DataSource } from 'typeorm';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';
import { SmsTemplateEntity } from '../entity/sms-template.entity';

export const smsTemplateProviders = [
  {
    provide: MODELS.SMS_TEMPLATE,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(SmsTemplateEntity),
    inject: [UZ_SMS_PANEL],
  },
];