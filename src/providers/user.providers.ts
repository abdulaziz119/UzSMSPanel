import { DataSource } from 'typeorm';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';
import { UserEntity } from '../entity/user.entity';

export const userProviders = [
  {
    provide: MODELS.USER,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(UserEntity),
    inject: [UZ_SMS_PANEL],
  },
];
