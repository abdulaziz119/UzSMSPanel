import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity, cascadeUpdateRelationOptions } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { UserEntity } from './user.entity';
import { SmsGroupEntity } from './sms-group.entity';
import { SmsMessageEntity } from './sms-message.entity';
import {
  PaymentMethodEnum,
  TransactionStatusEnum,
  TransactionTypeEnum,
} from '../utils/enum/transaction.enum';

@Entity({ schema: DB_SCHEMA, name: 'transactions' })
@Index(['user_id', 'type', 'status'])
@Index(['created_at', 'status'])
@Index(['transaction_id'])
@Index(['group_id'])
@Index(['sms_message_id'])
export class TransactionEntity extends BaseEntity {
  @Column({ type: 'integer' })
  user_id: number;

  @ManyToOne(
    () => UserEntity,
    (user) => user.transactions,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'integer', nullable: true })
  group_id: number | null;

  @ManyToOne(
    () => SmsGroupEntity,
    (group) => group.id,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'group_id' })
  smsGroup: SmsGroupEntity | null;

  @Column({ type: 'integer', nullable: true })
  sms_message_id: number | null;

  @ManyToOne(
    () => SmsMessageEntity,
    (sms) => sms.transactions,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'sms_message_id' })
  smsMessage: SmsMessageEntity | null;

  @Column({ type: 'varchar', length: 100, unique: true })
  transaction_id: string;

  @Column({ type: 'enum', enum: TransactionTypeEnum })
  type: TransactionTypeEnum;

  @Column({
    type: 'enum',
    enum: TransactionStatusEnum,
    default: TransactionStatusEnum.PENDING,
  })
  status: TransactionStatusEnum;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  fee: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  balance_before: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  balance_after: number;

  @Column({ type: 'varchar', length: 10, default: 'UZS' })
  currency: string;

  @Column({ type: 'enum', enum: PaymentMethodEnum, nullable: true })
  payment_method: PaymentMethodEnum | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  external_transaction_id: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string | null;

  @Column({ type: 'timestamp', nullable: true })
  processed_at: Date | null;
}
