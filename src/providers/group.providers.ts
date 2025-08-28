import { DataSource } from 'typeorm';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';
import { GroupEntity } from '../entity/group.entity';

export const groupProviders = [
  {
    provide: MODELS.GROUP,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(GroupEntity),
    inject: [UZ_SMS_PANEL],
  },
];
