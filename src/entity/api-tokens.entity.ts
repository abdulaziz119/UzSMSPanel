import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { DB_SCHEMA } from '../utils/env/env';
import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';

export enum TokenStatusEnum {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

@Entity({ schema: DB_SCHEMA, name: 'api_tokens' })
@Index(['user_id', 'status'])
export class ApiTokensEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 100 })
  token_name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  token_hash: string;

  @Column({ type: 'varchar', length: 50 })
  token_prefix: string;

  @Column({ type: 'enum', enum: TokenStatusEnum, default: TokenStatusEnum.ACTIVE })
  status: TokenStatusEnum;

  @Column({ type: 'json', nullable: true })
  permissions: string[] | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  allowed_ips: string | null;

  @Column({ type: 'timestamp', nullable: true })
  last_used_at: Date | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  last_used_ip: string | null;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date | null;

  @ManyToOne(() => UserEntity, (user) => user.apiTokens)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
