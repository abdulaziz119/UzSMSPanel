import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';

export enum TariffStatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity({ schema: DB_SCHEMA, name: 'tariffs' })
@Index(['operator', 'status'])
export class TariffEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  operator: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price_per_sms: number;

  @Column({ type: 'varchar', length: 10, default: 'UZS' })
  currency: string;

  @Column({ type: 'enum', enum: TariffStatusEnum, default: TariffStatusEnum.ACTIVE })
  status: TariffStatusEnum;

  @Column({ type: 'varchar', length: 100, nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: false })
  is_default: boolean;
}
