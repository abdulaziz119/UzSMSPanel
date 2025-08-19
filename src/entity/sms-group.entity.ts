import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity, cascadeUpdateRelationOptions } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { UserEntity } from './user.entity';
import { SmsContactEntity } from './sms-contact.entity';
import { TransactionEntity } from './transaction.entity';

@Entity({ schema: DB_SCHEMA, name: 'sms_groups' })
export class SmsGroupEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  title: string | null;

  @Column({ type: 'integer', nullable: true, default: 0 })
  contact_count: number | null;

  @Column({ type: 'integer' })
  user_id: number;

  @ManyToOne(
    () => UserEntity,
    (entity) => entity.smsGroup,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @OneToMany(
    () => SmsContactEntity,
    (entity) => entity.smsGroup,
    cascadeUpdateRelationOptions,
  )
  smsContact: SmsContactEntity[];

  @OneToMany(() => TransactionEntity, (t) => t.smsGroup, cascadeUpdateRelationOptions)
  transactions: TransactionEntity[];
}
