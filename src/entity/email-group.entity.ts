import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity, cascadeUpdateRelationOptions } from './base.entity';
import { DB_SCHEMA } from '../utils/env/env';
import { UserEntity } from './user.entity';
import { EmailContactEntity } from './email-contact.entity';
import { EmailGroupStatusEnum } from '../utils/enum/email-smtp.enum';
import { EmailMessageEntity } from './email-message.entity';

@Entity({ schema: DB_SCHEMA, name: 'email_groups' })
export class EmailGroupEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'integer', nullable: true, default: 0 })
  contact_count: number | null;

  @Column({
    type: 'enum',
    enum: EmailGroupStatusEnum,
    default: EmailGroupStatusEnum.ACTIVE,
  })
  status: EmailGroupStatusEnum;

  @Column({ type: 'integer' })
  user_id: number;

  @ManyToOne(
    () => UserEntity,
    (entity) => entity.emailGroups,
    cascadeUpdateRelationOptions,
  )
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @OneToMany(
    () => EmailContactEntity,
    (entity) => entity.emailGroup,
    cascadeUpdateRelationOptions,
  )
  emailContacts: EmailContactEntity[];

  @OneToMany(
    () => EmailMessageEntity,
    (entity) => entity.emailGroup,
    cascadeUpdateRelationOptions,
  )
  emailMessages: EmailMessageEntity[];
}
