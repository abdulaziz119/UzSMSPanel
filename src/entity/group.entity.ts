import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity, cascadeUpdateRelationOptions } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { UserEntity } from './user.entity';
import { SmsContactEntity } from './sms-contact.entity';
import { TransactionEntity } from './transaction.entity';
import { GroupEnum } from '../utils/enum/group.enum';

@Entity({ schema: DB_SCHEMA, name: 'groups' })
export class GroupEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  title: string | null;

  @Column({ type: 'integer', nullable: true, default: 0 })
  contact_count: number | null;

  @Column({ type: 'integer' })
  user_id: number;

  @ManyToOne(
    () => UserEntity,
    (entity) => entity.group,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({
    type: 'enum',
    enum: GroupEnum,
    default: GroupEnum.SMS,
  })
  type: GroupEnum; // SMS yoki EMAIL

  @OneToMany(
    () => SmsContactEntity,
    (entity) => entity.group,
    cascadeUpdateRelationOptions,
  )
  smsContact: SmsContactEntity[];

  @OneToMany(
    () => TransactionEntity,
    (t) => t.group,
    cascadeUpdateRelationOptions,
  )
  transactions: TransactionEntity[];
}
