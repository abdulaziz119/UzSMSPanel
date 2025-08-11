import { DataSource } from 'typeorm';
import { OtpEntity } from '../../../../entity/otp.entity';
import { UZ_SMS_PANEL, MODELS } from '../../../../constants/constants';

export const otpProviders = [
  {
    provide: MODELS.OTP,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(OtpEntity),
    inject: [UZ_SMS_PANEL],
  },
];
