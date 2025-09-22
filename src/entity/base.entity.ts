import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BeforeRemove,
  BeforeInsert,
} from 'typeorm';
import * as Orm from 'typeorm';
import { getUzbekistanTime } from '../utils/time/uzbekistan-time';

export class BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @BeforeInsert()
  setCreateDate(): void {
    this.created_at = getUzbekistanTime();
    this.updated_at = getUzbekistanTime();
  }

  setUpdateDate(): void {
    this.updated_at = getUzbekistanTime();
  }

  @BeforeRemove()
  setDeleteDate(): void {
    this.deleted_at = getUzbekistanTime();
  }
}

export const defaultRelationOptions: Orm.RelationOptions = {
  onDelete: 'CASCADE',
};

export const cascadeUpdateRelationOptions: Orm.RelationOptions = {
  cascade: ['update'],
  onDelete: 'CASCADE',
  eager: false,
};
