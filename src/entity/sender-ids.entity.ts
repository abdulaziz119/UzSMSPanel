import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { DB_SCHEMA } from '../utils/env/env';
import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';

export enum SenderIdStatusEnum {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  BLOCKED = 'blocked',
}

@Entity({ schema: DB_SCHEMA, name: 'sender_ids' })
@Index(['user_id', 'status'])
export class SenderIdsEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 20 })
  sender_name: string;

  @Column({
    type: 'enum',
    enum: SenderIdStatusEnum,
    default: SenderIdStatusEnum.PENDING,
  })
  status: SenderIdStatusEnum;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  document_url: string | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  rejection_reason: string | null;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  approved_at: Date | null;

  @ManyToOne(() => UserEntity, (user) => user.senderIds)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'approved_by' })
  approver: UserEntity;
}
