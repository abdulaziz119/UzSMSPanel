import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity, cascadeUpdateRelationOptions } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { UserEntity } from './user.entity';
import { SenderStatusEnum } from '../utils/enum/sms-sender.enum';

@Entity({ schema: DB_SCHEMA, name: 'sms_senders' })
@Index(['user_id', 'name'], { unique: true })
@Index(['status'])
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

  // Pricing info per screenshot (operator subscription or one-time)
  @Column({ type: 'varchar', length: 100, nullable: false })
  operator: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  monthly_price: number;
}
