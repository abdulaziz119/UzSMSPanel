import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity, cascadeUpdateRelationOptions } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { UserEntity } from './user.entity';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
} from '../utils/enum/sms-message.enum';
import { MessageTypeEnum } from '../utils/enum/sms-price.enum';

@Entity({ schema: DB_SCHEMA, name: 'sms_messages' })
@Index(['user_id', 'status', 'created_at'])
@Index(['phone', 'created_at'])
export class SmsMessageEntity extends BaseEntity {
  @Column({ type: 'integer' })
  user_id: number;

  @ManyToOne(
    () => UserEntity,
    (user) => user.smsMessages,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'integer' })
  sms_template: number;

  @Column({ type: 'integer', nullable: true })
  group_id: number | null;

  @Column({ type: 'varchar', length: 20, nullable: false })
  phone: string;

  @Column({ type: 'text', nullable: false })
  message: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  sms_template_id: string | null;

  @Column({
    type: 'enum',
    enum: MessageStatusEnum,
    default: MessageStatusEnum.PENDING,
  })
  status: MessageStatusEnum;

  @Column({
    type: 'enum',
    enum: MessageDirectionEnum,
    default: MessageDirectionEnum.OUTBOUND,
  })
  direction: MessageDirectionEnum;

  @Column({ type: 'enum', enum: MessageTypeEnum, default: MessageTypeEnum.SMS })
  message_type: MessageTypeEnum;

  @Column({ type: 'varchar', length: 100, nullable: true })
  operator: string | null;

  @Column({ type: 'integer', default: 1 })
  parts_count: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  cost: number;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @Column({ type: 'json', nullable: true })
  delivery_report: any | null;
}
