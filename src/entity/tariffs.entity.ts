import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { CountryEntity } from './country.entity';

@Entity({ schema: DB_SCHEMA, name: 'tariffs' })
@Index(['country_id', 'phone_ext'])
@Index(['country_id', 'code'])
export class TariffEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 10, nullable: true })
  code: string | null; // Operator kodi (masalan: "90", "91", "93")

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string | null; // Tariff nomi (masalan: "Beeline", "Vodafone")

  @Column({ type: 'varchar', length: 15, nullable: true })
  phone_ext: string | null; // Telefon prefiksi (masalan: "99890", "99891", "7916")

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  price: number; // SMS narxi (4 ta decimal uchun)

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  price_provider_sms: number; //provider dan olingan asil nar

  @Column({ type: 'boolean', default: true })
  public: boolean; // Ommaviy foydalanish uchun ruxsat

  @Column({ type: 'varchar', length: 100 })
  operator: string; // Operator nomi (masalan: "BEELINE", "VODAFONE", "T-MOBILE")

  @Column({ type: 'integer', nullable: false })
  country_id: number; // Majburiy davlat ID

  // Many tariffs belong to one country
  @ManyToOne(() => CountryEntity, (country) => country.tariffs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'country_id' })
  country: CountryEntity;
}
