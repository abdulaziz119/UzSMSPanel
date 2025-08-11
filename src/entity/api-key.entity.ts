import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import {
  BaseEntity,
  BigintTransformer,
  cascadeUpdateRelationOptions,
} from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { UserEntity } from './user.entity';
import { ApiKeyStatusEnum } from '../utils/enum/api-key.enum';

@Entity({ schema: DB_SCHEMA, name: 'api_keys' })
@Index(['user_id', 'status'])
@Index(['key_hash'])
export class ApiKeyEntity extends BaseEntity {
  @Column({ type: 'bigint', transformer: new BigintTransformer() })
  user_id: number;

  @ManyToOne(() => UserEntity, (entity) => entity, cascadeUpdateRelationOptions)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  key_hash: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  prefix: string | null;

  @Column({
    type: 'enum',
    enum: ApiKeyStatusEnum,
    default: ApiKeyStatusEnum.ACTIVE,
  })
  status: ApiKeyStatusEnum;

  @Column({ type: 'json', nullable: true })
  permissions: any;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  last_used_at: Date | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  last_used_ip: string | null;

  @Column({ type: 'integer', default: 0 })
  requests_count: number;

  @Column({ type: 'integer', default: 1000 })
  requests_limit: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;
}
