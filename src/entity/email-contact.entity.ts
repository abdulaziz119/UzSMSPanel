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
import { EmailGroupEntity } from './email-group.entity';
import { EmailMessageEntity } from './email-message.entity';

@Entity({ schema: DB_SCHEMA, name: 'email_contacts' })
@Index(['user_id', 'email'])
@Index(['email_group_id'])
export class EmailContactEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'integer' })
  user_id: number;

  @Column({ type: 'integer' })
  email_group_id: number;

  @ManyToOne(
    () => UserEntity,
    (entity) => entity.emailContacts,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(
    () => EmailGroupEntity,
    (entity) => entity.emailContacts,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'email_group_id' })
  emailGroup: EmailGroupEntity;

  @OneToMany(
    () => EmailMessageEntity,
    (entity) => entity.emailMessage,
    cascadeUpdateRelationOptions,
  )
  emailMessages: EmailMessageEntity[];
}
