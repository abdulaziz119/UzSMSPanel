import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EmailGroupEntity } from '../entity/email-group.entity';
import {
  CreateEmailGroupDto,
  UpdateEmailGroupDto,
  EmailGroupQueryDto,
} from '../utils/dto/email-group.dto';
import { PaginationBuilder } from '../utils/pagination.builder';
import { MODELS } from '../constants/constants';
import { SingleResponse } from '../utils/dto/dto';
import { PaginationResponse } from '../utils/pagination.response';

@Injectable()
export class EmailGroupService {
  constructor(
    @Inject(MODELS.EMAIL_GROUP)
    private emailGroupRepository: Repository<EmailGroupEntity>,
  ) {}

  async create(
    userId: number,
    createDto: CreateEmailGroupDto,
  ): Promise<SingleResponse<EmailGroupEntity>> {
    const emailGroup: EmailGroupEntity = this.emailGroupRepository.create({
      ...createDto,
      user_id: userId,
    });

    const result: EmailGroupEntity =
      await this.emailGroupRepository.save(emailGroup);
    return { result: result };
  }

  async findAll(
    userId: number,
    query: EmailGroupQueryDto,
  ): Promise<PaginationResponse<EmailGroupEntity[]>> {
    const queryBuilder = this.emailGroupRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.emailContacts', 'contacts')
      .where('group.user_id = :userId', { userId });

    if (query.search) {
      queryBuilder.andWhere('(group.title ILIKE :search)', {
        search: `%${query.search}%`,
      });
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
  ): Promise<SingleResponse<EmailGroupEntity>> {
    const group: EmailGroupEntity = await this.findOne(userId, id);
    Object.assign(group, updateDto);
    const result: EmailGroupEntity =
      await this.emailGroupRepository.save(group);
    return { result: result };
  }

  async remove(userId: number, id: number): Promise<void> {
    const group: EmailGroupEntity = await this.findOne(userId, id);
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
}
