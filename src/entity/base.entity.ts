import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ValueTransformer,
} from 'typeorm';
import * as Orm from 'typeorm';

export class BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}

export class BigintTransformer implements ValueTransformer {
  from(value: string | null): number | null {
    if (value === null || value === undefined || value === 'null') {
      return null;
    }
    return Number(value);
  }

  to(value: number | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    return String(value);
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
