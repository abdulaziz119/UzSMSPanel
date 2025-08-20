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
import { EmailMessageEntity } from './email-message.entity';

@Entity({ schema: DB_SCHEMA, name: 'email_smtp' })
@Index(['user_id'])
@Index(['host', 'port'])
export class EmailSmtpEntity extends BaseEntity {
  @Column({ type: 'integer' })
  user_id: number;

  @ManyToOne(
    () => UserEntity,
    (user) => user.emailSmtps,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  host: string;

  @Column({ type: 'integer', nullable: false })
  port: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  username: string;

  @Column({ type: 'varchar', length: 255, nullable: false, select: false })
  password: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  from_email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  from_name: string | null;

  @Column({ type: 'boolean', default: true })
  use_ssl: boolean;

  @Column({ type: 'boolean', default: true })
  use_tls: boolean;

  @OneToMany(
    () => EmailMessageEntity,
    (entity) => entity.emailSmtp,
    cascadeUpdateRelationOptions,
  )
  emailMessages: EmailMessageEntity[];
}
