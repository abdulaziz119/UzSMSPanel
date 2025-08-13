import { DataSource } from 'typeorm';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';
import { CountryEntity } from '../entity/country.entity';

export const countryProviders = [
  {
    provide: MODELS.COUNTRY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(CountryEntity),
    inject: [UZ_SMS_PANEL],
  },
];
