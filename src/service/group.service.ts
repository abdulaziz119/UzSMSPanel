import {
  Inject,
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { PaginationParams, ParamIdDto, SingleResponse } from '../utils/dto/dto';
import { PaginationResponse } from '../utils/pagination.response';
import { getPaginationResponse } from '../utils/pagination.builder';
import { GroupEntity } from '../entity/group.entity';
import {
  CreateGroupDto,
  GroupFilterDto,
  UpdateGroupDto,
} from '../utils/dto/group.dto';

@Injectable()
export class GroupService {
  constructor(
    @Inject(MODELS.GROUP)
    private readonly groupRepo: Repository<GroupEntity>,
  ) {}

  async create(
    payload: CreateGroupDto,
    user_id: number,
  ): Promise<SingleResponse<GroupEntity>> {
    try {
      const newSmsGroup: GroupEntity = this.groupRepo.create({
        title: payload.title,
        user_id: user_id,
        contact_count: 0,
      });

      const savedSmsGroup: GroupEntity = await this.groupRepo.save(newSmsGroup);
      return { result: savedSmsGroup };
    } catch (error) {
      throw new HttpException(
        { message: 'Error creating Group', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(
    payload: PaginationParams,
  ): Promise<PaginationResponse<GroupEntity[]>> {
    const { page = 1, limit = 10 } = payload;
    const skip: number = (page - 1) * limit;

    try {
      const queryBuilder = this.groupRepo
        .createQueryBuilder('groups')
        .where('groups.id IS NOT NULL');

      const [smsGroupData, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .orderBy('groups.created_at', 'DESC')
        .getManyAndCount();

      return getPaginationResponse<GroupEntity>(
        smsGroupData,
        page,
        limit,
        total,
      );
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching Groups', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    updateData: UpdateGroupDto,
    user_id: number,
  ): Promise<SingleResponse<GroupEntity>> {
    const smsGroup: GroupEntity = await this.groupRepo.findOne({
      where: { id: updateData.id, user_id: user_id },
    });

    if (!smsGroup) {
      throw new HttpException('Group not found', HttpStatus.NOT_FOUND);
    }

    try {
      await this.groupRepo.update(updateData.id, updateData);
      const updatedSmsGroup: GroupEntity = await this.groupRepo.findOne({
        where: { id: updateData.id },
        relations: ['user'],
      });
      return { result: updatedSmsGroup };
    } catch (error) {
      throw new HttpException(
        { message: 'Error updating Group', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAllGroups(
    filters: GroupFilterDto,
  ): Promise<PaginationResponse<GroupEntity[]>> {
    try {
      const queryBuilder = this.groupRepo
        .createQueryBuilder('group')
        .leftJoinAndSelect('group.user', 'user');

      // Apply filters
      if (filters.user_id) {
        queryBuilder.andWhere('group.user_id = :user_id', {
          user_id: filters.user_id,
        });
      }

      if (filters.search) {
        queryBuilder.andWhere('group.title ILIKE :search', {
          search: `%${filters.search}%`,
        });
      }

      if (filters.date_from) {
        queryBuilder.andWhere('group.created_at >= :date_from', {
          date_from: filters.date_from,
        });
      }

      if (filters.date_to) {
        queryBuilder.andWhere('group.created_at <= :date_to', {
          date_to: filters.date_to,
        });
      }

      queryBuilder.orderBy('group.created_at', 'DESC');

      const total: number = await queryBuilder.getCount();

      if (filters.page && filters.limit) {
        queryBuilder
          .skip((filters.page - 1) * filters.limit)
          .take(filters.limit);
      }

      const groups: GroupEntity[] = await queryBuilder.getMany();

      return getPaginationResponse(
        groups,
        total,
        filters.page || 1,
        filters.limit || 10,
      );
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching groups', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getGroupDetails(id: number): Promise<SingleResponse<GroupEntity>> {
    try {
      const group: GroupEntity = await this.groupRepo.findOne({
        where: { id },
        relations: ['user', 'contacts'],
      });

      if (!group) {
        throw new HttpException('Group not found', HttpStatus.NOT_FOUND);
      }

      return { result: group };
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching group details', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getGroupStatistics() {
    try {
      const stats = await this.groupRepo
        .createQueryBuilder('group')
        .select([
          'COUNT(*) as total_groups',
          'SUM(contact_count) as total_contacts',
          'AVG(contact_count) as average_contacts_per_group',
          'MAX(contact_count) as max_contacts_in_group',
          'COUNT(CASE WHEN contact_count = 0 THEN 1 ELSE NULL END) as empty_groups',
        ])
        .getRawOne();

      const topGroups: GroupEntity[] = await this.groupRepo
        .createQueryBuilder('group')
        .leftJoinAndSelect('group.user', 'user')
        .orderBy('group.contact_count', 'DESC')
        .limit(10)
        .getMany();

      const result = {
        overview: stats,
        top_groups: topGroups,
      };

      return { result };
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching group statistics', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserGroups(user_id: number): Promise<SingleResponse<GroupEntity[]>> {
    try {
      const groups: GroupEntity[] = await this.groupRepo.find({
        where: { user_id },
        order: { created_at: 'DESC' },
      });

      return { result: groups };
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching user groups', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async delete(payload: ParamIdDto): Promise<{ result: true }> {
    const { id } = payload;
    await this.groupRepo.softDelete(id);
    return { result: true };
  }
}
