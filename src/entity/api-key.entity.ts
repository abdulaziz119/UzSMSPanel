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

  @Column({ type: 'varchar', length: 255, unique: true })
  key_hash: string;

  @Column({
    type: 'enum',
    enum: ApiKeyStatusEnum,
    default: ApiKeyStatusEnum.ACTIVE,
  })
  status: ApiKeyStatusEnum;
}
