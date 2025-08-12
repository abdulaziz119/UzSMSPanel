import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { SenderPriceEntity } from '../entity/sender-price.entity';
import { PaginationParams } from '../utils/dto/dto';
import { PaginationResponse } from '../utils/pagination.response';
import { getPaginationResponse } from '../utils/pagination.builder';

@Injectable()
export class SenderPriceService {
  constructor(
    @Inject(MODELS.SENDER_PRICE)
    private readonly senderPriceRepo: Repository<SenderPriceEntity>,
  ) {}

  async findAll(query: PaginationParams): Promise<PaginationResponse<SenderPriceEntity[]>> {
    const { page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;
    try {
      const qb = this.senderPriceRepo
        .createQueryBuilder('sender_prices')
        .where('sender_prices.active = :active', { active: true });
      const [items, total] = await qb
        .skip(skip)
        .take(limit)
        .orderBy('sender_prices.operator_name', 'ASC')
        .getManyAndCount();
      return getPaginationResponse(items, page, limit, total);
    } catch (error) {
      throw new HttpException({ message: 'Error fetching operator prices', error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
