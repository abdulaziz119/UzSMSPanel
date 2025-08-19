import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity, cascadeUpdateRelationOptions } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { UserEntity } from './user.entity';
import { EmailSmtpEntity } from './email-smtp.entity';
import { EmailTemplateEntity } from './email-template.entity';
import { EmailGroupEntity } from './email-group.entity';
import { EmailStatusEnum } from '../utils/enum/email-smtp.enum';

@Entity({ schema: DB_SCHEMA, name: 'email_messages' })
@Index(['user_id', 'status'])
@Index(['recipient_email'])
@Index(['sent_at'])
export class EmailMessageEntity extends BaseEntity {
  @Column({ type: 'integer' })
  user_id: number;

  @Column({ type: 'integer', nullable: true })
  email_smtp_id: number | null;

  @Column({ type: 'integer', nullable: true })
  email_template_id: number | null;

  @Column({ type: 'integer', nullable: true })
  email_group_id: number | null;

  @Column({ type: 'varchar', length: 255, nullable: false })
  recipient_email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recipient_name: string | null;

  @Column({ type: 'varchar', length: 500, nullable: false })
  subject: string;

  @Column({ type: 'text', nullable: false })
  html_content: string;

  @Column({ type: 'text', nullable: true })
  text_content: string | null;

  @Column({
    type: 'enum',
    enum: EmailStatusEnum,
    default: EmailStatusEnum.PENDING,
  })
  status: EmailStatusEnum;

  @Column({ type: 'timestamp', nullable: true })
  sent_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  opened_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  clicked_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  bounced_at: Date | null;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  message_id: string | null;

  @Column({ type: 'integer', default: 0 })
  retry_count: number;

  @ManyToOne(() => UserEntity, (user) => user.emailMessages, cascadeUpdateRelationOptions)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => EmailSmtpEntity, (smtp) => smtp.emailMessages, cascadeUpdateRelationOptions)
  @JoinColumn({ name: 'email_smtp_id' })
  emailSmtp: EmailSmtpEntity;

  @ManyToOne(() => EmailTemplateEntity, (template) => template.emailMessages, cascadeUpdateRelationOptions)
  @JoinColumn({ name: 'email_template_id' })
  emailTemplate: EmailTemplateEntity;

  @ManyToOne(() => EmailGroupEntity, (group) => group.emailMessages, cascadeUpdateRelationOptions)
  @JoinColumn({ name: 'email_group_id' })
  emailGroup: EmailGroupEntity;
}
