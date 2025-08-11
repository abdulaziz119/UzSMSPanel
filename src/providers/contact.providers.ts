import { DataSource } from 'typeorm';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';
import { ContactEntity } from '../entity/contact.entity';

export const contactProviders = [
  {
    provide: MODELS.CONTACT,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(ContactEntity),
    inject: [UZ_SMS_PANEL],
  },
];