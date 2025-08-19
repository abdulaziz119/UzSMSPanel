import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EmailGroupEntity } from '../entity/email-group.entity';
import {
  CreateEmailGroupDto,
  UpdateEmailGroupDto,
  EmailGroupQueryDto,
} from '../utils/dto/email-group.dto';
import { EmailGroupStatusEnum } from '../utils/enum/email-smtp.enum';
import { PaginationBuilder } from '../utils/pagination.builder';
import { MODELS } from '../constants/constants';

@Injectable()
export class EmailGroupService {
  constructor(
    @Inject(MODELS.EMAIL_GROUP)
    private emailGroupRepository: Repository<EmailGroupEntity>,
  ) {}

  async create(
    userId: number,
    createDto: CreateEmailGroupDto,
  ): Promise<EmailGroupEntity> {
    const emailGroup = this.emailGroupRepository.create({
      ...createDto,
      user_id: userId,
      status: EmailGroupStatusEnum.ACTIVE,
    });

    return this.emailGroupRepository.save(emailGroup);
  }

  async findAll(userId: number, query: EmailGroupQueryDto) {
    const queryBuilder = this.emailGroupRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.emailContacts', 'contacts')
      .where('group.user_id = :userId', { userId });

    if (query.status) {
      queryBuilder.andWhere('group.status = :status', { status: query.status });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(group.title ILIKE :search OR group.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    queryBuilder.orderBy('group.created_at', 'DESC');

    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .limit(query.limit)
      .offset((query.page - 1) * query.limit)
      .getMany();

    return PaginationBuilder.build(data, query.page, query.limit, total);
  }

  async findOne(userId: number, id: number): Promise<EmailGroupEntity> {
    const group = await this.emailGroupRepository.findOne({
      where: { id, user_id: userId },
      relations: ['emailContacts'],
    });

    if (!group) {
      throw new NotFoundException('Email group not found');
    }

    return group;
  }

  async update(
    userId: number,
    id: number,
    updateDto: UpdateEmailGroupDto,
  ): Promise<EmailGroupEntity> {
    const group = await this.findOne(userId, id);
    Object.assign(group, updateDto);
    return this.emailGroupRepository.save(group);
  }

  async remove(userId: number, id: number): Promise<void> {
    const group = await this.findOne(userId, id);
    await this.emailGroupRepository.remove(group);
  }

  async updateContactCount(groupId: number): Promise<void> {
    const result = await this.emailGroupRepository
      .createQueryBuilder('group')
      .leftJoin('group.emailContacts', 'contacts', 'contacts.is_active = true')
      .select('COUNT(contacts.id)', 'count')
      .where('group.id = :groupId', { groupId })
      .getRawOne();

    await this.emailGroupRepository.update(groupId, {
      contact_count: parseInt(result.count) || 0,
    });
  }

  async getActiveGroups(userId: number): Promise<EmailGroupEntity[]> {
    return this.emailGroupRepository.find({
      where: {
        user_id: userId,
        status: EmailGroupStatusEnum.ACTIVE,
      },
      order: { title: 'ASC' },
    });
  }
}
