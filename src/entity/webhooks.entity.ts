import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { DB_SCHEMA } from '../utils/env/env';
import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';

export enum WebhookStatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  FAILED = 'failed',
}

export enum WebhookEventEnum {
  SMS_DELIVERED = 'sms.delivered',
  SMS_FAILED = 'sms.failed',
  SMS_SENT = 'sms.sent',
  BALANCE_LOW = 'balance.low',
  SENDER_APPROVED = 'sender.approved',
  SENDER_REJECTED = 'sender.rejected',
}

@Entity({ schema: DB_SCHEMA, name: 'webhooks' })
@Index(['user_id', 'status'])
export class WebhooksEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'enum', enum: WebhookStatusEnum, default: WebhookStatusEnum.ACTIVE })
  status: WebhookStatusEnum;

  @Column({ type: 'json' })
  events: WebhookEventEnum[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  secret: string | null;

  @Column({ type: 'int', default: 0 })
  retry_count: number;

  @Column({ type: 'int', default: 3 })
  max_retries: number;

  @Column({ type: 'timestamp', nullable: true })
  last_triggered_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  last_success_at: Date | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  last_error: string | null;

  @ManyToOne(() => UserEntity, (user) => user.webhooks)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
