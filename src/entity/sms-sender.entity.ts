import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity, cascadeUpdateRelationOptions } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { UserEntity } from './user.entity';
import { SenderPriceEntity } from './sender-price.entity';
import { SenderStatusEnum } from '../utils/enum/sms-sender.enum';

@Entity({ schema: DB_SCHEMA, name: 'sms_senders' })
@Index(['user_id', 'name'], { unique: true })
@Index(['status'])
@Index(['sender_price_id'])
export class SmsSenderEntity extends BaseEntity {
  @Column({ type: 'integer' })
  user_id: number;

  @ManyToOne(
    () => UserEntity,
    (user) => user.smsSenders,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  // Alfa nomi / NIK
  @Column({ type: 'varchar', length: 20 })
  name: string;

  @Column({
    type: 'enum',
    enum: SenderStatusEnum,
    default: SenderStatusEnum.PENDING,
  })
  status: SenderStatusEnum;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  links: string | null;

  @Column({ type: 'integer' })
  sender_price_id: number;

  @ManyToOne(
    () => SenderPriceEntity,
    (senderPrice) => senderPrice.smsSenders,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'sender_price_id' })
  senderPrice: SenderPriceEntity;
}
