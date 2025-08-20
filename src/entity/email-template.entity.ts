import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { BaseEntity, cascadeUpdateRelationOptions } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { UserEntity } from './user.entity';
import { EmailTemplateStatusEnum } from '../utils/enum/email-smtp.enum';
import { EmailMessageEntity } from './email-message.entity';
import { FileEntity } from './file.entity';

@Entity({ schema: DB_SCHEMA, name: 'email_templates' })
@Index(['user_id', 'status'])
@Index(['name'])
export class EmailTemplateEntity extends BaseEntity {
  @Column({ type: 'integer' })
  user_id: number;

  @ManyToOne(
    () => UserEntity,
    (user) => user.emailTemplates,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 200, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: false })
  subject: string;

  @Column({ type: 'text', nullable: false })
  html_content: string;

  @Column({ type: 'text', nullable: true })
  text_content: string | null;

  @Column({
    type: 'enum',
    enum: EmailTemplateStatusEnum,
    default: EmailTemplateStatusEnum.ACTIVE,
  })
  status: EmailTemplateStatusEnum;

  @Column({ type: 'integer', default: 0 })
  usage_count: number;

  @Column({ type: 'timestamp', nullable: true })
  last_used_at: Date | null;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string | null;

  @Column({ type: 'json', nullable: true })
  variables: Record<string, any> | null;

  @Column({ type: 'integer', nullable: true })
  file_id: number | null;

  @ManyToOne(
    () => FileEntity,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'file_id' })
  file: FileEntity;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50, default: 'html' })
  template_type: string; // 'html', 'builder', 'drag-drop'

  @Column({ type: 'json', nullable: true })
  builder_data: Record<string, any> | null; // For template builder data

  @Column({ type: 'json', nullable: true })
  styles: Record<string, any> | null; // CSS styles

  // Attachment files - stores array of file IDs
  @Column({ type: 'json', nullable: true })
  attachment_file_ids: number[] | null;

  @ManyToMany(() => FileEntity)
  @JoinTable({
    name: 'email_template_attachments',
    joinColumn: { name: 'template_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'file_id', referencedColumnName: 'id' },
  })
  attachmentFiles: FileEntity[];

  // Image files - stores array of objects with file ID and settings
  @Column({ type: 'json', nullable: true })
  image_files: Array<{
    file_id: number;
    cid: string; // Content ID for inline images
    alt_text?: string;
    position?: 'inline' | 'attachment';
  }> | null;

  @ManyToMany(() => FileEntity)
  @JoinTable({
    name: 'email_template_images',
    joinColumn: { name: 'template_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'file_id', referencedColumnName: 'id' },
  })
  imageFiles: FileEntity[];

  // Design settings with file references
  @Column({ type: 'json', nullable: true })
  design_settings: {
    background_color?: string;
    text_color?: string;
    font_family?: string;
    font_size?: string;
    button_color?: string;
    button_text_color?: string;
    logo_file_id?: number; // Reference to FileEntity
    header_image_file_id?: number; // Reference to FileEntity
    footer_text?: string;
  } | null;

  // Logo file relation
  @ManyToOne(() => FileEntity, { nullable: true })
  @JoinColumn({ name: 'logo_file_id' })
  logoFile: FileEntity;

  @Column({ type: 'integer', nullable: true })
  logo_file_id: number | null;

  // Header image file relation
  @ManyToOne(() => FileEntity, { nullable: true })
  @JoinColumn({ name: 'header_image_file_id' })
  headerImageFile: FileEntity;

  @Column({ type: 'integer', nullable: true })
  header_image_file_id: number | null;

  @Column({ type: 'boolean', default: false })
  is_responsive: boolean;

  @Column({ type: 'text', nullable: true })
  css_styles: string | null;

  @Column({ type: 'text', nullable: true })
  preview_text: string | null; // Email preview text

  @OneToMany(
    () => EmailMessageEntity,
    (entity) => entity.emailTemplate,
    cascadeUpdateRelationOptions,
  )
  emailMessages: EmailMessageEntity[];
}
