import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { BaseEntity, cascadeUpdateRelationOptions } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { UserEntity } from './user.entity';
import { ContactStatusEnum, ContactTypeEnum } from '../utils/enum/contact.enum';
import {
  CommonData,
  Contacts,
  DocData,
  Address,
} from '../utils/interfaces/contact.interfaces';

@Entity({ schema: DB_SCHEMA, name: 'contacts' })
export class ContactEntity extends BaseEntity {
  @Column({ type: 'integer' })
  user_id: number;

  @ManyToOne(
    () => UserEntity,
    (user) => user.contacts,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'integer' })
  my_go_id: number | null;

  @Column({ type: 'varchar', nullable: true })
  identity_code: string | null;

  @Column({ type: 'varchar', nullable: true })
  method_type: string | null;

  @Column({ type: 'varchar', nullable: true })
  code_from: string | null;

  @Column({ type: 'varchar', nullable: true })
  code: string | null;

  @Column({ type: 'integer' })
  step: number | null;

  @Column({ type: 'varchar', nullable: true })
  step_type: string | null;

  @Column({ type: 'varchar', nullable: true })
  step_result: string | null;

  @Column({ type: 'varchar', nullable: true })
  step_error: string | null;

  @Column({ type: 'boolean', nullable: true })
  success: boolean | null;

  @Column({ type: 'varchar', nullable: true })
  access_token: string | null;

  @Column({ type: 'varchar', nullable: true })
  refresh_token: string | null;

  @Column({ type: 'varchar', nullable: true })
  job_id: string | null;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  my_go_created_at: Date | null;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  my_go_updated_at: Date | null;

  // Asosiy ma'lumotlar - nested object sifatida
  @Column({ type: 'json', nullable: true })
  commonData: CommonData | null;

  // Hujjat ma'lumotlari - nested object sifatida
  @Column({ type: 'json', nullable: true })
  docData: DocData | null;

  // Aloqa ma'lumotlari - nested object sifatida
  @Column({ type: 'json', nullable: true })
  contacts: Contacts | null;

  // Manzillar - array of objects sifatida
  @Column({ type: 'json', nullable: true })
  address: Address[] | null;

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

  @Column({ type: 'integer', nullable: true })
  passport_file_url: number | null;

  @Column({ type: 'integer', nullable: true })
  address_file_url: number | null;

  @Column({ type: 'varchar', nullable: true })
  company_name: string | null;

  @Column({ type: 'integer', nullable: true })
  company_regis_file_url: number | null;

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

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number;
}
