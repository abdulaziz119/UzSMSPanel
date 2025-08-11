import { Column, Entity, Unique, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';

@Entity({ schema: DB_SCHEMA, name: 'otps' })
@Unique(['email'])
export class OtpEntity extends BaseEntity {
  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ length: 6, nullable: false })
  otp: string;

  @Column({ type: 'timestamp', nullable: false })
  otpSendAt: Date;

  @Column({ type: 'int', default: 0, nullable: false })
  retryCount: number;
}
