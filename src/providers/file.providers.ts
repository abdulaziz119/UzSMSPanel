import { DataSource } from 'typeorm';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';
import { FileEntity } from '../entity/file.entity';

export const fileProviders = [
  {
    provide: MODELS.FILE,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(FileEntity),
    inject: [UZ_SMS_PANEL],
  },
];
