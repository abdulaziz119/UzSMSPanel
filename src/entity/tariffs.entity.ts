import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { CountryEntity } from './country.entity';

@Entity({ schema: DB_SCHEMA, name: 'tariffs' })
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

  @Column({ type: 'integer', nullable: true })
  country_id: number | null;

  // Many tariffs belong to one country
  @ManyToOne(() => CountryEntity, (country) => country.tariffs)
  @JoinColumn({ name: 'country_id' })
  country: CountryEntity;
}
