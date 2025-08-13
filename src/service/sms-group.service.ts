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
import { SmsGroupEntity } from '../entity/sms-group.entity';
import {
  CreateSmsGroupDto,
  UpdateSmsGroupDto,
} from '../utils/dto/sms-group.dto';

export interface GroupFilterDto extends PaginationParams {
  user_id?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface CreateGroupDto {
  title: string;
  description?: string;
}

export interface UpdateGroupDto {
  id: number;
  title?: string;
  description?: string;
}

@Injectable()
export class SmsGroupService {
  constructor(
    @Inject(MODELS.SMS_GROUP)
    private readonly smsGroupRepo: Repository<SmsGroupEntity>,
  ) {}

  async create(
    payload: CreateSmsGroupDto,
    user_id: number,
  ): Promise<SingleResponse<SmsGroupEntity>> {
    try {
      const newSmsGroup: SmsGroupEntity = this.smsGroupRepo.create({
        title: payload.title,
        user_id: user_id,
        contact_count: 0,
      });

      const savedSmsGroup: SmsGroupEntity =
        await this.smsGroupRepo.save(newSmsGroup);
      return { result: savedSmsGroup };
    } catch (error) {
      throw new HttpException(
        { message: 'Error creating Sms Group', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(
    payload: PaginationParams,
  ): Promise<PaginationResponse<SmsGroupEntity[]>> {
    const { page = 1, limit = 10 } = payload;
    const skip: number = (page - 1) * limit;

    try {
      const queryBuilder = this.smsGroupRepo
        .createQueryBuilder('sms_groups')
        .where('sms_groups.id IS NOT NULL');

      const [smsGroupData, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .orderBy('sms_groups.created_at', 'DESC')
        .getManyAndCount();

      return getPaginationResponse<SmsGroupEntity>(
        smsGroupData,
        page,
        limit,
        total,
      );
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching SMS Groups', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(payload: ParamIdDto): Promise<SingleResponse<SmsGroupEntity>> {
    const smsGroup: SmsGroupEntity = await this.smsGroupRepo.findOne({
      where: { id: payload.id },
    });

    if (!smsGroup) {
      throw new NotFoundException('Sms Group not found');
    }

    return { result: smsGroup };
  }

  async update(
    updateData: UpdateSmsGroupDto,
    user_id: number,
  ): Promise<SingleResponse<SmsGroupEntity>> {
    const smsGroup = await this.smsGroupRepo.findOne({
      where: { id: updateData.id, user_id: user_id },
    });

    if (!smsGroup) {
      throw new NotFoundException('Sms Group not found');
    }

    try {
      await this.smsGroupRepo.update(updateData.id, updateData);
      const updatedSmsGroup = await this.smsGroupRepo.findOne({
        where: { id: updateData.id },
        relations: ['user'],
      });
      return { result: updatedSmsGroup };
    } catch (error) {
      throw new HttpException(
        { message: 'Error updating Sms Group', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Dashboard-specific methods
  async findAllGroups(filters: GroupFilterDto): Promise<PaginationResponse<SmsGroupEntity[]>> {
    try {
      const queryBuilder = this.smsGroupRepo.createQueryBuilder('group')
        .leftJoinAndSelect('group.user', 'user');

      // Apply filters
      if (filters.user_id) {
        queryBuilder.andWhere('group.user_id = :user_id', { user_id: filters.user_id });
      }

      if (filters.search) {
        queryBuilder.andWhere('group.title ILIKE :search', { search: `%${filters.search}%` });
      }

      if (filters.date_from) {
        queryBuilder.andWhere('group.created_at >= :date_from', { date_from: filters.date_from });
      }

      if (filters.date_to) {
        queryBuilder.andWhere('group.created_at <= :date_to', { date_to: filters.date_to });
      }

      queryBuilder.orderBy('group.created_at', 'DESC');

      const total = await queryBuilder.getCount();
      
      if (filters.page && filters.limit) {
        queryBuilder
          .skip((filters.page - 1) * filters.limit)
          .take(filters.limit);
      }

      const groups = await queryBuilder.getMany();

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

  async getGroupDetails(id: number): Promise<SingleResponse<SmsGroupEntity>> {
    try {
      const group = await this.smsGroupRepo.findOne({
        where: { id },
        relations: ['user', 'contacts'],
      });

      if (!group) {
        throw new NotFoundException('Group not found');
      }

      return { result: group };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        { message: 'Error fetching group details', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getGroupStatistics(): Promise<SingleResponse<any>> {
    try {
      const stats = await this.smsGroupRepo
        .createQueryBuilder('group')
        .select([
          'COUNT(*) as total_groups',
          'SUM(contact_count) as total_contacts',
          'AVG(contact_count) as average_contacts_per_group',
          'MAX(contact_count) as max_contacts_in_group',
          'COUNT(CASE WHEN contact_count = 0 THEN 1 ELSE NULL END) as empty_groups',
        ])
        .getRawOne();

      // Get top groups by contact count
      const topGroups = await this.smsGroupRepo
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

  async getUserGroups(user_id: number): Promise<SingleResponse<SmsGroupEntity[]>> {
    try {
      const groups = await this.smsGroupRepo.find({
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
    await this.smsGroupRepo.softDelete(id);
    return { result: true };
  }
}
