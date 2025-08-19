import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity, cascadeUpdateRelationOptions } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { UserEntity } from './user.entity';
import { SmtpStatusEnum } from '../utils/enum/email-smtp.enum';
import { EmailMessageEntity } from './email-message.entity';

@Entity({ schema: DB_SCHEMA, name: 'email_smtp' })
@Index(['user_id', 'status'])
@Index(['host', 'port'])
export class EmailSmtpEntity extends BaseEntity {
  @Column({ type: 'integer' })
  user_id: number;

  @ManyToOne(() => UserEntity, (user) => user.emailSmtps, cascadeUpdateRelationOptions)
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

  @Column({
    type: 'enum',
    enum: SmtpStatusEnum,
    default: SmtpStatusEnum.ACTIVE,
  })
  status: SmtpStatusEnum;

  @Column({ type: 'integer', default: 0 })
  daily_limit: number;

  @Column({ type: 'integer', default: 0 })
  sent_today: number;

  @Column({ type: 'timestamp', nullable: true })
  last_used_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  last_reset_at: Date | null;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string | null;

  @OneToMany(
    () => EmailMessageEntity,
    (entity) => entity.emailSmtp,
    cascadeUpdateRelationOptions,
  )
  emailMessages: EmailMessageEntity[];
}
