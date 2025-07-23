import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  Index,
} from 'typeorm';
import { DB_SCHEMA } from '../utils/env/env';
import {
  BaseEntity,
  BigintTransformer,
  cascadeUpdateRelationOptions,
} from './base.entity';
import { UserEntity } from './user.entity';
import { TariffEntity } from './tariffs.entity';

export enum SmsStatusEnum {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

@Entity({ schema: DB_SCHEMA, name: 'sms_messages' })
@Index(['user_id', 'status', 'created_at'])
@Index(['external_message_id'])
export class SmsMessagesEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 20 })
  recipient_phone: string;

  @Column({ type: 'text' })
  message_text: string;

  @Column({ type: 'enum', enum: SmsStatusEnum, default: SmsStatusEnum.QUEUED })
  status: SmsStatusEnum;

  @Column({ type: 'varchar', length: 20, nullable: true })
  sender_id: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  external_message_id: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  cost: number | null;

  @Column({ type: 'int', default: 1 })
  parts_count: number;

  @Column({ type: 'timestamp', nullable: true })
  sent_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  error_message: string | null;

  @Column({ type: 'int', default: 0 })
  retry_count: number;

  @Column({ type: 'varchar', length: 45, nullable: true })
  operator_code: string | null;

  @Column({ type: 'bigint', transformer: new BigintTransformer() })
  user_id: number;

  @ManyToOne(
    () => UserEntity,
    (user) => user.smsMessages,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToMany(() => TariffEntity)
  @JoinTable()
  tariffs: TariffEntity[];
}
