import { DataSource } from 'typeorm';
import { MODELS, UZ_SMS_PANEL } from '../constants/constants';
import { OtpEntity } from '../entity/otps.entity';

export const otpsProviders = [
  {
    provide: MODELS.OTPS,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(OtpEntity),
    inject: [UZ_SMS_PANEL],
  },
];
