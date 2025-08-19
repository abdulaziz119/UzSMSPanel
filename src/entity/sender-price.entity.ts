import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { SmsSenderEntity } from './sms-sender.entity';

@Entity({ schema: DB_SCHEMA, name: 'sender_prices' })
@Index(['operator'], { unique: true })
export class SenderPriceEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  operator: string;

  @Column({ type: 'varchar', length: 100 })
  operator_name: string;

  // abon to'lov (oylik)
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  monthly_fee: number;

  @Column({ type: 'varchar', length: 10, default: 'UZS' })
  currency: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @OneToMany(() => SmsSenderEntity, (sender) => sender.senderPrice)
  smsSenders: SmsSenderEntity[];
}
