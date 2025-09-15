import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';

@Entity('excels')
export class ExcelEntity extends BaseEntity {
  @Column({ name: 'total_rows', type: 'integer', default: 0 })
  totalRows: number;

  @Column({ name: 'processed_rows', type: 'integer', default: 0 })
  processedRows: number;

  @Column({ name: 'duplicate_rows', type: 'integer', default: 0 })
  duplicateRows: number;

  @Column({ name: 'invalid_format_rows', type: 'integer', default: 0 })
  invalidFormatRows: number;

  @Column({ name: 'created_rows', type: 'integer', default: 0 })
  createdRows: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'file_path', type: 'varchar' })
  filePath: string;

  @Column({ name: 'status', type: 'varchar', default: 'pending' }) // pending, processing, completed, failed
  status: string;
}
