import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { DB_SCHEMA } from '../utils/env/env';
import { UserEntity } from './user.entity';
import {
  BaseEntity,
  BigintTransformer,
  cascadeUpdateRelationOptions,
} from './base.entity';

@Entity({ schema: DB_SCHEMA, name: 'message_templates' })
export class MessageTemplatesEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  template_name: string;

  @Column({ type: 'text' })
  template_text: string;

  @Column({ type: 'boolean', default: false })
  is_approved: boolean;

  @Column({ type: 'bigint', transformer: new BigintTransformer() })
  user_id: number;

  @ManyToOne(
    () => UserEntity,
    (user) => user.templates,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
