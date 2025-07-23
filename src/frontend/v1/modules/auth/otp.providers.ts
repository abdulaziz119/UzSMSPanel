import { DataSource } from 'typeorm';
import { OtpEntity } from '../../../../entity/otp.entity';
import { FIX_MARKET_SOURCE, MODELS } from '../../../../constants/constants';

export const otpProviders = [
  {
    provide: MODELS.OTP,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(OtpEntity),
    inject: [FIX_MARKET_SOURCE],
  },
];
