import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity, cascadeUpdateRelationOptions } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { UserEntity } from './user.entity';
import { EmailGroupEntity } from './email-group.entity';

@Entity({ schema: DB_SCHEMA, name: 'email_contacts' })
@Index(['user_id', 'email'])
@Index(['email_group_id'])
export class EmailContactEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  first_name: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  last_name: string | null;

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

  @Column({ type: 'timestamp', nullable: true })
  last_email_sent_at: Date | null;

  @Column({ type: 'integer', default: 0 })
  total_emails_sent: number;

  @Column({ type: 'integer', default: 0 })
  bounced_count: number;

  @Column({ type: 'text', nullable: true })
  unsubscribe_reason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  unsubscribed_at: Date | null;
}
