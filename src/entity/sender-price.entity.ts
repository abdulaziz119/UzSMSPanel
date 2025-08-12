import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { OperatorEnum } from '../utils/enum/sms-price.enum';

@Entity({ schema: DB_SCHEMA, name: 'sender_prices' })
@Index(['operator'], { unique: true })
export class SenderPriceEntity extends BaseEntity {
  @Column({ type: 'enum', enum: OperatorEnum })
  operator: OperatorEnum;

  @Column({ type: 'varchar', length: 100 })
  operator_name: string;

  // abon to'lov (oylik)
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  monthly_fee: number;

  // bir martalik
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  one_time_fee: number;

  @Column({ type: 'varchar', length: 10, default: 'UZS' })
  currency: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'text', nullable: true })
  description: string | null;
}
