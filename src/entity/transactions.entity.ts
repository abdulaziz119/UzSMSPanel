import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import {
  BaseEntity,
  BigintTransformer,
  cascadeUpdateRelationOptions,
} from './base.entity';
import { UserEntity } from './user.entity';
import { DB_SCHEMA } from '../utils/env/env';

@Entity({ schema: DB_SCHEMA, name: 'transactions' })
export class TransactionsEntity extends BaseEntity {
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 50 })
  payment_method: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'completed' | 'failed';

  @Column({ type: 'bigint', transformer: new BigintTransformer() })
  user_id: number;

  @ManyToOne(
    () => UserEntity,
    (user) => user.transactions,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
