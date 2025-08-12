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
      const newOrder: SmsGroupEntity = this.smsGroupRepo.create({});

      const savedOrder: SmsGroupEntity = await this.smsGroupRepo.save(newOrder);
      return { result: savedOrder };
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
    const skip = (page - 1) * limit;

    try {
      const queryBuilder = this.smsGroupRepo
        .createQueryBuilder('orders')
        .where('orders.id IS NOT NULL');

      const [orderData, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .orderBy('orders.created_at', 'DESC')
        .getManyAndCount();

      return getPaginationResponse<SmsGroupEntity>(
        orderData,
        page,
        limit,
        total,
      );
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching orders', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(payload: ParamIdDto): Promise<SingleResponse<SmsGroupEntity>> {
    const order: SmsGroupEntity = await this.smsGroupRepo.findOne({
      where: { id: payload.id },
    });

    if (!order) {
      throw new NotFoundException('Sms Group not found');
    }

    return { result: order };
  }

  async delete(payload: ParamIdDto): Promise<{ result: true }> {
    const { id } = payload;
    await this.smsGroupRepo.softDelete(id);
    return { result: true };
  }
}
