import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import {
  BaseEntity,
  BigintTransformer,
  cascadeUpdateRelationOptions,
} from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { UserEntity } from './user.entity';
import { SmsGroupEntity } from './sms-group.entity';
import { SmsTemplateEntity } from './sms-template.entity';
import {
  CampaignStatusEnum,
  CampaignTypeEnum,
} from '../utils/enum/sms-campaign.enum';
import { MessageTypeEnum } from '../utils/enum/sms-price.enum';

@Entity({ schema: DB_SCHEMA, name: 'sms_campaigns' })
@Index(['user_id', 'status'])
@Index(['scheduled_at', 'status'])
@Index(['created_at'])
export class SmsCampaignEntity extends BaseEntity {
  @Column({ type: 'bigint', transformer: new BigintTransformer() })
  user_id: number;

  @ManyToOne(() => UserEntity, (entity) => entity, cascadeUpdateRelationOptions)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 200, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: CampaignStatusEnum,
    default: CampaignStatusEnum.DRAFT,
  })
  status: CampaignStatusEnum;

  @Column({
    type: 'enum',
    enum: CampaignTypeEnum,
    default: CampaignTypeEnum.IMMEDIATE,
  })
  type: CampaignTypeEnum;

  @Column({
    type: 'bigint',
    transformer: new BigintTransformer(),
    nullable: true,
  })
  group_id: number | null;

  @ManyToOne(
    () => SmsGroupEntity,
    (entity) => entity,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'group_id' })
  group: SmsGroupEntity;

  @Column({
    type: 'bigint',
    transformer: new BigintTransformer(),
    nullable: true,
  })
  template_id: number | null;

  @ManyToOne(
    () => SmsTemplateEntity,
    (entity) => entity,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'template_id' })
  template: SmsTemplateEntity;

  @Column({ type: 'text', nullable: false })
  message: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  sender: string | null;

  @Column({ type: 'enum', enum: MessageTypeEnum, default: MessageTypeEnum.SMS })
  message_type: MessageTypeEnum;

  @Column({ type: 'timestamp', nullable: true })
  scheduled_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'integer', default: 0 })
  total_recipients: number;

  @Column({ type: 'integer', default: 0 })
  sent_count: number;

  @Column({ type: 'integer', default: 0 })
  delivered_count: number;

  @Column({ type: 'integer', default: 0 })
  failed_count: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  total_cost: number;

  @Column({ type: 'json', nullable: true })
  recipients: any;

  @Column({ type: 'json', nullable: true })
  settings: any;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;
}
