import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { DB_SCHEMA } from '../utils/env/env';
import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';

export enum ApiMethodEnum {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

export enum ApiStatusEnum {
  SUCCESS = 'success',
  ERROR = 'error',
  FAILED = 'failed',
}

@Entity({ schema: DB_SCHEMA, name: 'api_logs' })
@Index(['user_id', 'method', 'status', 'created_at'])
export class ApiLogsEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 255 })
  endpoint: string;

  @Column({ type: 'enum', enum: ApiMethodEnum })
  method: ApiMethodEnum;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  user_agent: string | null;

  @Column({ type: 'json', nullable: true })
  request_payload: any;

  @Column({ type: 'json', nullable: true })
  response_data: any;

  @Column({ type: 'enum', enum: ApiStatusEnum })
  status: ApiStatusEnum;

  @Column({ type: 'int', default: 200 })
  status_code: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  error_message: string | null;

  @Column({ type: 'int', default: 0 })
  response_time_ms: number;

  @ManyToOne(() => UserEntity, (user) => user.apiLogs)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
