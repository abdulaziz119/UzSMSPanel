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

  async delete(payload: ParamIdDto): Promise<{ result: true }> {
    const { id } = payload;
    await this.smsGroupRepo.softDelete(id);
    return { result: true };
  }
}
