import { Entity, Column, Index, OneToMany } from 'typeorm';
import { DB_SCHEMA } from '../utils/env/env';
import { BaseEntity } from './base.entity';
import { language, UserRoleEnum } from '../utils/enum/user.enum';
import { SmsMessagesEntity } from './sms-messages.entity';
import { TransactionsEntity } from './transactions.entity';
import { MessageTemplatesEntity } from './message-templates.entity';

@Entity({ schema: DB_SCHEMA, name: 'users' })
@Index(['email', 'role', 'block'])
export class UserEntity extends BaseEntity {
  @Column({ type: 'enum', enum: UserRoleEnum })
  role: UserRoleEnum;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', default: language })
  language: language;

  @Column({ type: 'varchar' })
  password: string | null;

  @Column({ nullable: true, type: 'float', scale: 1, default: 0 })
  balance: number | null;

  @Column({ type: 'boolean', default: false })
  block: boolean;

  @OneToMany(() => SmsMessagesEntity, (smsMessage) => smsMessage.user)
  smsMessages: SmsMessagesEntity[];

  @OneToMany(() => TransactionsEntity, (transaction) => transaction.user)
  transactions: TransactionsEntity[];

  @OneToMany(() => MessageTemplatesEntity, (template) => template.user)
  templates: MessageTemplatesEntity[];
}
