import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity, cascadeUpdateRelationOptions } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { GroupEntity } from './group.entity';
import {
  SMSContactStatusEnum,
  SmsContactTyeEnum,
} from '../utils/enum/sms-contact.enum';
import { GroupEnum } from '../utils/enum/group.enum';

@Entity({ schema: DB_SCHEMA, name: 'sms_contacts' })
@Index(['phone'])
export class SmsContactEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({
    type: 'enum',
    enum: SMSContactStatusEnum,
    default: SMSContactStatusEnum.ACTIVE,
  })
  status: SMSContactStatusEnum;

  @Column({ type: 'varchar', length: 20, nullable: false })
  phone: string;

  @Column({
    type: 'enum',
    enum: SmsContactTyeEnum,
    default: SmsContactTyeEnum.SMS,
  })
  type: SmsContactTyeEnum; // SMS yoki EMAIL

  @Column({ type: 'varchar', nullable: true })
  group_name: string | null;

  @Column({ type: 'integer' })
  group_id: number;

  @ManyToOne(
    () => GroupEntity,
    (group) => group.smsContact,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'group_id' })
  group: GroupEntity;
}
