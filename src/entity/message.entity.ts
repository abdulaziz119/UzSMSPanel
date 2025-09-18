import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity, cascadeUpdateRelationOptions } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { UserEntity } from './user.entity';
import { GroupEntity } from './group.entity';
import { SmsTemplateEntity } from './sms-template.entity';
import { TransactionEntity } from './transaction.entity';
import {
  MessageStatusEnum,
  MessageTypeEnum,
} from '../utils/enum/sms-message.enum';

@Entity({ schema: DB_SCHEMA, name: 'messages' })
@Index([
  'user_id',
  'status',
  'created_at',
  'phone',
  'price_provider_sms',
  'cost',
])
export class MessageEntity extends BaseEntity {
  @Column({ type: 'integer' })
  user_id: number;

  @ManyToOne(
    () => UserEntity,
    (user) => user.messages,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'integer', nullable: true })
  group_id: number | null;

  @ManyToOne(() => GroupEntity, undefined, cascadeUpdateRelationOptions)
  @JoinColumn({ name: 'group_id' })
  group: GroupEntity;

  @Column({ type: 'varchar', length: 20, nullable: false })
  phone: string;

  @Column({ type: 'text', nullable: false })
  message: string;

  @Column({ type: 'integer', nullable: true })
  sms_template_id: number | null;

  @ManyToOne(() => SmsTemplateEntity, undefined, cascadeUpdateRelationOptions)
  @JoinColumn({ name: 'sms_template_id' })
  smsTemplate: SmsTemplateEntity;

  @Column({
    type: 'enum',
    enum: MessageStatusEnum,
    default: MessageStatusEnum.PENDING,
  })
  status: MessageStatusEnum;

  @Column({ type: 'enum', enum: MessageTypeEnum, default: MessageTypeEnum.SMS })
  message_type: MessageTypeEnum;

  @Column({ type: 'varchar', length: 100, nullable: true })
  operator: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  cost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  price_provider_sms: number; //provider dan olingan asil nar

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  smpp_message_id: string | null;

  @Column({
    type: 'json',
    nullable: true,
  })
  delivery_report: {
    id?: string; // Message ID from SMPP
    sub?: string; // Number of messages submitted
    dlvrd?: string; // Number of messages delivered
    submit_date?: string; // Submit date (YYMMDDhhmm)
    done_date?: string; // Done date (YYMMDDhhmm)
    stat?: string; // Message status (DELIVRD, EXPIRED, DELETED, etc.)
    err?: string; // Error code
    text?: string; // First 20 characters of original message
  } | null;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
  })
  response_received_at: Date | null;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
  })
  pending_since: Date | null;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
  })
  pending_expired_at: Date | null;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'When the temporary Redis pending key was removed for this message',
  })
  redis_removed_at: Date | null;

  @OneToMany(
    () => TransactionEntity,
    (t) => t.message,
    cascadeUpdateRelationOptions,
  )
  transactions: TransactionEntity[];
}
