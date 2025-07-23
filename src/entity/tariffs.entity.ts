import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';

@Entity({ schema: DB_SCHEMA, name: 'tariffs' })
export class TariffEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  operator: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price_per_sms: number;

  @Column({ type: 'varchar', length: 10, default: 'UZS' })
  currency: string;
}
