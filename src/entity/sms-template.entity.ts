import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import {
  BaseEntity,
  BigintTransformer,
  cascadeUpdateRelationOptions,
} from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { UserEntity } from './user.entity';
import { TemplateStatusEnum } from '../utils/enum/sms-template.enum';

@Entity({ schema: DB_SCHEMA, name: 'sms_templates' })
@Index(['user_id', 'status'])
@Index(['name'])
export class SmsTemplateEntity extends BaseEntity {
  @Column({ type: 'bigint', transformer: new BigintTransformer() })
  user_id: number;

  @ManyToOne(() => UserEntity, (entity) => entity, cascadeUpdateRelationOptions)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 200, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({
    type: 'enum',
    enum: TemplateStatusEnum,
    default: TemplateStatusEnum.ACTIVE,
  })
  status: TemplateStatusEnum;

  @Column({ type: 'integer', default: 0 })
  usage_count: number;

  @Column({ type: 'timestamp', nullable: true })
  last_used_at: Date | null;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string | null;
}
