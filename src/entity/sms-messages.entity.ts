import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
import { DB_SCHEMA } from '../utils/env/env';
import {
  BaseEntity,
  BigintTransformer,
  cascadeUpdateRelationOptions,
} from './base.entity';
import { UserEntity } from './user.entity';
import { TariffEntity } from './tariffs.entity';

@Entity({ schema: DB_SCHEMA, name: 'sms_messages' })
export class SmsMessagesEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 20 })
  recipient_phone: string;

  @Column({ type: 'text' })
  message_text: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'sent' | 'failed';

  @Column({ type: 'timestamp', nullable: true })
  sent_at: Date;

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
