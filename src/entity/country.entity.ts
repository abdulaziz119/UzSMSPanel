import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { TariffEntity } from './tariffs.entity';

@Entity({ schema: DB_SCHEMA, name: 'countries' })
export class CountryEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 3, nullable: false, unique: true })
  code: string; // ISO 3166-1 alpha-3 code (e.g., UZB, USA, RUS)

  @Column({ type: 'varchar', length: 2, nullable: false, unique: true })
  iso_code: string; // ISO 3166-1 alpha-2 code (e.g., UZ, US, RU)

  @Column({ type: 'varchar', length: 10, nullable: true })
  phone_code: string; // International dialing code (e.g., +998, +1, +7)

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency: string; // Currency code (e.g., UZS, USD, RUB)

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  // One country can have many tariffs
  @OneToMany(() => TariffEntity, (tariff) => tariff.country)
  tariffs: TariffEntity[];
}
