import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity, cascadeUpdateRelationOptions } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { EmailGroupEntity } from './email-group.entity';

@Entity({ schema: DB_SCHEMA, name: 'email_contacts' })
@Index(['email'])
export class EmailContactEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'varchar', length: 255, nullable: false })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  group_name: string | null;

  @Column({ type: 'integer' })
  group_id: number;

  @ManyToOne(
    () => EmailGroupEntity,
    (entity) => entity.emailContacts,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'group_id' })
  emailGroup: EmailGroupEntity;
}
