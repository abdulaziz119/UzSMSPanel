import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import {
  BaseEntity,
  BigintTransformer,
  cascadeUpdateRelationOptions,
} from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { UserEntity } from './user.entity';

export enum TransactionTypeEnum {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  SMS_PAYMENT = 'sms_payment',
  REFUND = 'refund',
  BONUS = 'bonus',
  PENALTY = 'penalty',
}

export enum TransactionStatusEnum {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentMethodEnum {
  CLICK = 'click',
  PAYME = 'payme',
  UZCARD = 'uzcard',
  HUMO = 'humo',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  SYSTEM = 'system',
}

@Entity({ schema: DB_SCHEMA, name: 'balance_transactions' })
@Index(['user_id', 'type', 'status'])
@Index(['created_at', 'status'])
@Index(['transaction_id'])
export class BalanceTransactionEntity extends BaseEntity {
  @Column({ type: 'bigint', transformer: new BigintTransformer() })
  user_id: number;

  @ManyToOne(
    () => UserEntity,
    (entity) => entity,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 100, unique: true })
  transaction_id: string;

  @Column({ type: 'enum', enum: TransactionTypeEnum })
  type: TransactionTypeEnum;

  @Column({ type: 'enum', enum: TransactionStatusEnum, default: TransactionStatusEnum.PENDING })
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
