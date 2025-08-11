import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import {
  BaseEntity,
  BigintTransformer,
  cascadeUpdateRelationOptions,
} from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { UserEntity } from './user.entity';
import { SmsGroupEntity } from './sms-group.entity';

@Entity({ schema: DB_SCHEMA, name: 'sms_companys' })
export class SmsCompanyEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'varchar', nullable: true })
  pattern: string | null;

  @Column({ type: 'bigint', transformer: new BigintTransformer() })
  group_id: number;

  @ManyToOne(
    () => SmsGroupEntity,
    (entity) => entity.smsContact,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'group_id' })
  smsGroup: SmsGroupEntity;
}
