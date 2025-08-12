import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import {
  BaseEntity,
  BigintTransformer,
  cascadeUpdateRelationOptions,
} from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { UserEntity } from './user.entity';
import { language } from '../utils/enum/user.enum';
import { ContactStatusEnum, ContactTypeEnum } from '../utils/enum/contact.enum';
import { FileEntity } from './file.entity';

@Entity({ schema: DB_SCHEMA, name: 'contacts' })
@Index(['user_id', 'status'])
@Index(['phone', 'phone_ext'])
export class ContactEntity extends BaseEntity {
  @Column({ type: 'bigint', transformer: new BigintTransformer() })
  user_id: number;

  @ManyToOne(() => UserEntity, (entity) => entity, cascadeUpdateRelationOptions)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({
    type: 'enum',
    enum: ContactStatusEnum,
    default: ContactStatusEnum.ACTIVE,
  })
  status: ContactStatusEnum;

  @Column({
    type: 'enum',
    enum: ContactTypeEnum,
    default: ContactTypeEnum.INDIVIDUAL,
  })
  type: ContactTypeEnum;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'integer', nullable: true })
  birth_year: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 20, nullable: false })
  @Index()
  phone: string;

  @Column({ type: 'varchar', length: 8, nullable: true })
  phone_ext: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  passport_seria: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  passport_number: string | null;

  @Column({ type: 'varchar', nullable: true })
  passport_given_by: string | null;

  @Column({ type: 'date', nullable: true })
  passport_expiration_date: Date | null;

  @ManyToOne(() => FileEntity)
  @JoinColumn({ name: 'passport_file_id' })
  passport_file: FileEntity;

  @Column({ type: 'bigint', transformer: new BigintTransformer(), nullable: true })
  passport_file_id: number | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @ManyToOne(() => FileEntity)
  @JoinColumn({ name: 'address_file_id' })
  address_file: FileEntity;

  @Column({ type: 'bigint', transformer: new BigintTransformer(), nullable: true })
  address_file_id: number | null;

  @Column({ type: 'varchar', nullable: true })
  company_name: string | null;

  @Column({ type: 'varchar', nullable: true })
  company_bank_name: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  company_bank_id: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  company_inn: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  company_mfo: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  company_okonx: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  prefix: string | null;

  @Column({ type: 'enum', enum: language, default: language.UZ })
  lang: language;
}
