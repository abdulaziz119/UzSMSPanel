import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity, cascadeUpdateRelationOptions } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { UserEntity } from './user.entity';
import { EmailSmtpEntity } from './email-smtp.entity';
import { EmailTemplateEntity } from './email-template.entity';
import { EmailGroupEntity } from './email-group.entity';
import { EmailStatusEnum } from '../utils/enum/email-smtp.enum';

@Entity({ schema: DB_SCHEMA, name: 'email_messages' })
@Index(['user_id', 'status', 'created_at', 'recipient_email'])
export class EmailMessageEntity extends BaseEntity {
  @Column({ type: 'integer' })
  user_id: number;

  @Column({ type: 'integer', nullable: true })
  email_smtp_id: number | null;

  @Column({ type: 'integer', nullable: true })
  email_template_id: number | null;

  @Column({ type: 'integer', nullable: true })
  group_id: number | null;

  @Column({ type: 'varchar', length: 255, nullable: false })
  recipient_email: string;

  @Column({
    type: 'enum',
    enum: EmailStatusEnum,
    default: EmailStatusEnum.PENDING,
  })
  status: EmailStatusEnum;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  cost: number;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @ManyToOne(
    () => UserEntity,
    (user) => user.emailMessages,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(
    () => EmailSmtpEntity,
    (smtp) => smtp.emailMessages,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'email_smtp_id' })
  emailSmtp: EmailSmtpEntity;

  @ManyToOne(
    () => EmailTemplateEntity,
    (template) => template.emailMessages,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'email_template_id' })
  emailTemplate: EmailTemplateEntity;

  @ManyToOne(() => EmailGroupEntity, undefined, cascadeUpdateRelationOptions)
  @JoinColumn({ name: 'group_id' })
  emailGroup: EmailGroupEntity;
}
