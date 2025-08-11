import { Entity, Column, Index, OneToMany, Unique } from 'typeorm';
import { DB_SCHEMA } from '../utils/env/env';
import { BaseEntity, cascadeUpdateRelationOptions } from './base.entity';
import { language, UserRoleEnum } from '../utils/enum/user.enum';
import { SmsGroupEntity } from './sms-group.entity';

@Entity({ schema: DB_SCHEMA, name: 'users' })
@Unique(['login'])
@Index(['email', 'role', 'block'])
export class UserEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone_ext: string | null;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'varchar', default: language })
  language: language;

  @Column({ type: 'enum', enum: UserRoleEnum })
  role: UserRoleEnum;

  @Column({ type: 'varchar', length: 4, nullable: true })
  country_code: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastseen: Date | null;

  @Column({ type: 'boolean', default: false })
  block: boolean;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column({ select: false, nullable: true })
  secret_key: string | null;

  @Column({ select: false, nullable: true })
  refreshToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  refreshTokenExpiresAt: Date | null;

  @Column({ select: false, nullable: true })
  password: string | null;

  @Column({ select: false, nullable: true })
  login: string | null;

  @OneToMany(
    () => SmsGroupEntity,
    (entity) => entity.user,
    cascadeUpdateRelationOptions,
  )
  smsGroup: SmsGroupEntity[];
}
