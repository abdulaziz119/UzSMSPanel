import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { MessageTypeEnum } from '../utils/enum/sms-price.enum';

@Entity({ schema: DB_SCHEMA, name: 'sms_prices' })
@Index(['operator', 'message_type', 'active'])
@Index(['country_code', 'operator'])
export class SmsPriceEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 4, nullable: false })
  country_code: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  country_name: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  operator: string;

  @Column({ type: 'enum', enum: MessageTypeEnum, default: MessageTypeEnum.SMS })
  message_type: MessageTypeEnum;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  price_per_sms: number; //provider dan olingan asil nar

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  wholesale_price: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency: string | null;

  @Column({ type: 'integer', default: 160 })
  max_characters: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'json', nullable: true })
  additional_settings: any;
}
