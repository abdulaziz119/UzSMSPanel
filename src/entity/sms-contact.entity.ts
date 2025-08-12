import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import {
  BaseEntity,
  BigintTransformer,
  cascadeUpdateRelationOptions,
} from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { SmsGroupEntity } from './sms-group.entity';
import { SMSContactStatusEnum } from '../utils/enum/sms-contact.enum';

@Entity({ schema: DB_SCHEMA, name: 'sms_contacts' })
@Index(['phone'])
export class SmsContactEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({
    type: 'enum',
    enum: SMSContactStatusEnum,
    default: SMSContactStatusEnum.APPROVED,
  })
  status: SMSContactStatusEnum;

  @Column({ type: 'varchar', length: 20, nullable: false })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  group_name: string | null;

  @Column({ type: 'bigint', transformer: new BigintTransformer() })
  group_id: number;

  @ManyToOne(
    () => SmsGroupEntity,
    (entity) => entity.smsContact,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'group_id' })
  smsGroup: SmsGroupEntity;
}
