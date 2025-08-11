import { Entity, Column, Index, OneToMany } from 'typeorm';
import { DB_SCHEMA } from '../utils/env/env';
import { BaseEntity } from './base.entity';
import { language, UserRoleEnum } from '../utils/enum/user.enum';

@Entity({ schema: DB_SCHEMA, name: 'users' })
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

  @Column({ nullable: true })
  country_code: string | null;

  @Column({ type: 'varchar', nullable: true })
  ip: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastseen: Date | null;

  @Column({ type: 'boolean', default: false })
  block: boolean;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column({ select: false, nullable: true })
  refreshToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  refreshTokenExpiresAt: Date | null;

  @Column({ select: false, nullable: true })
  password: string | null;

  @Column({ select: false, nullable: true })
  login: string | null;
}
