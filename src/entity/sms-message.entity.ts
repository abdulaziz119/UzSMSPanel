import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import {
  BaseEntity,
  BigintTransformer,
  cascadeUpdateRelationOptions,
} from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { UserEntity } from './user.entity';
import {
  MessageDirectionEnum,
  MessageStatusEnum,
} from '../utils/enum/sms-message.enum';
import { MessageTypeEnum, OperatorEnum } from '../utils/enum/sms-price.enum';

@Entity({ schema: DB_SCHEMA, name: 'sms_messages' })
@Index(['user_id', 'status', 'created_at'])
@Index(['phone', 'created_at'])
@Index(['message_id'])
@Index(['batch_id'])
export class SmsMessageEntity extends BaseEntity {
  @Column({ type: 'bigint', transformer: new BigintTransformer() })
  user_id: number;

  @ManyToOne(() => UserEntity, (entity) => entity, cascadeUpdateRelationOptions)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 100, unique: true })
  message_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  batch_id: string | null;

  @Column({ type: 'varchar', length: 20, nullable: false })
  phone: string;

  @Column({ type: 'varchar', length: 8, nullable: true })
  phone_ext: string | null;

  @Column({ type: 'text', nullable: false })
  message: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  sender: string | null;

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

  @Column({ type: 'enum', enum: OperatorEnum, nullable: true })
  operator: OperatorEnum | null;

  @Column({ type: 'integer', default: 1 })
  parts_count: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  cost: number;

  @Column({ type: 'timestamp', nullable: true })
  sent_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at: Date | null;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  external_id: string | null;

  @Column({ type: 'json', nullable: true })
  delivery_report: any | null;
}
