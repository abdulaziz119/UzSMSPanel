import { Column, Entity, Index, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import {
  FileCategory,
  FileType,
  FileVisibility,
} from '../utils/enum/file.enum';

@Entity({ schema: DB_SCHEMA, name: 'files' })
@Index(['file_category', 'file_type'])
export class FileEntity extends BaseEntity {
  @Column({ type: 'text' })
  original_name: string;

  @Column({ type: 'text' })
  file_name: string;

  @Column({ type: 'text' })
  file_path: string;

  @Column({ type: 'text', nullable: true })
  public_url?: string;

  @Column({ type: 'varchar', length: 10 })
  file_extension: string;

  @Column({ type: 'varchar', length: 100 })
  mime_type: string;

  @Column({ type: 'enum', enum: FileType })
  file_type: FileType;

  @Column({ type: 'enum', enum: FileCategory, default: FileCategory.OTHER })
  file_category: FileCategory;

  @Column({ type: 'bigint' })
  file_size: number;

  @Column({
    type: 'enum',
    enum: FileVisibility,
    default: FileVisibility.PRIVATE,
  })
  visibility: FileVisibility;

  @Column({ type: 'int', default: 0 })
  download_count: number;

  @Column({ type: 'boolean', default: true })
  public: boolean;
}
