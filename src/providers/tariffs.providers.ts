import { DataSource } from 'typeorm';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';
import { TariffEntity } from '../entity/tariffs.entity';

export const tariffsProviders = [
  {
    provide: MODELS.TARIFFS,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(TariffEntity),
    inject: [UZ_SMS_PANEL],
  },
];