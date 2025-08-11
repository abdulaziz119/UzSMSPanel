import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';

@Entity({ schema: DB_SCHEMA, name: 'tariffs' })
@Index(['operator', 'status'])
export class TariffEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 4, nullable: true })
  code: string | null;

  @Column({ nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  phone_ext: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'boolean', default: true })
  public: boolean;

  @Column({ type: 'varchar', length: 50 })
  operator: string;
}
