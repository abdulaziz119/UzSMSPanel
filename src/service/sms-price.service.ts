import {
  Inject,
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { SmsPriceEntity } from '../entity/sms-price.entity';
import { SingleResponse } from '../utils/dto/dto';
import { PaginationResponse } from '../utils/pagination.response';
import { getPaginationResponse } from '../utils/pagination.builder';
import { MessageTypeEnum, OperatorEnum } from '../utils/enum/sms-price.enum';
import {
  PriceFilterDto,
  CreatePriceDto,
  UpdatePriceDto,
} from '../utils/dto/sms-price.dto';

@Injectable()
export class SmsPriceService {
  constructor(
    @Inject(MODELS.SMS_PRICE)
    private readonly priceRepo: Repository<SmsPriceEntity>,
  ) {}

  async findAll(
    filters: PriceFilterDto,
    isDashboard = false,
  ): Promise<PaginationResponse<SmsPriceEntity[]>> {
    try {
      const queryBuilder = this.priceRepo.createQueryBuilder('price');

      if (isDashboard === false) {
        queryBuilder.andWhere('price.active = :active', {
          active: true,
        });
      }

      if (filters.operator) {
        queryBuilder.andWhere('price.operator = :operator', {
          operator: filters.operator,
        });
      }

      if (filters.message_type) {
        queryBuilder.andWhere('price.message_type = :message_type', {
          message_type: filters.message_type,
        });
      }

      if (filters.is_active !== undefined) {
        queryBuilder.andWhere('price.active = :active', {
          active: filters.is_active,
        });
      }

      queryBuilder
        .orderBy('price.operator', 'ASC')
        .addOrderBy('price.message_type', 'ASC')
        .where('price.active = true');

      const total: number = await queryBuilder.getCount();

      if (filters.page && filters.limit) {
        queryBuilder
          .skip((filters.page - 1) * filters.limit)
          .take(filters.limit);
      }

      const prices: SmsPriceEntity[] = await queryBuilder.getMany();

      return getPaginationResponse(
        prices,
        total,
        filters.page || 1,
        filters.limit || 10,
      );
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching prices', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async create(data: CreatePriceDto): Promise<SingleResponse<SmsPriceEntity>> {
    try {
      const existingPrice: SmsPriceEntity = await this.priceRepo.findOne({
        where: {
          operator: data.operator,
          message_type: data.message_type,
        },
      });

      if (existingPrice) {
        throw new BadRequestException(
          'Price already exists for this operator and message type',
        );
      }
      const price: SmsPriceEntity = this.priceRepo.create({
        country_code: data.country_code,
        country_name: data.country_name,
        operator: data.operator,
        operator_name: data.operator.toString(),
        message_type: data.message_type,
        price_per_sms: data.price_per_sms,
        description: data.description ?? null,
      } as Partial<SmsPriceEntity>);
      const savedPrice: SmsPriceEntity = await this.priceRepo.save(price);

      return { result: savedPrice };
    } catch (error) {
      throw new HttpException(
        { message: 'Error creating price', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(data: UpdatePriceDto): Promise<SingleResponse<SmsPriceEntity>> {
    try {
      const price: SmsPriceEntity = await this.priceRepo.findOne({
        where: { id: data.id },
      });

      if (!price) {
        throw new NotFoundException('Price not found');
      }

      const updateData: Partial<SmsPriceEntity> = {};

      if (data.price_per_sms !== undefined) {
        updateData.price_per_sms = data.price_per_sms;
      }

      if (data.description !== undefined) {
        updateData.description = data.description;
      }

      if (data.is_active !== undefined) {
        updateData.active = data.is_active;
      }

      updateData.updated_at = new Date();

      await this.priceRepo.update(data.id, updateData);

      const updatedPrice: SmsPriceEntity = await this.priceRepo.findOne({
        where: { id: data.id },
      });

      return { result: updatedPrice };
    } catch (error) {
      throw new HttpException(
        { message: 'Error updating price', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async delete(id: number): Promise<SingleResponse<{ message: string }>> {
    try {
      const price: SmsPriceEntity = await this.priceRepo.findOne({
        where: { id },
      });

      if (!price) {
        throw new NotFoundException('Price not found');
      }

      await this.priceRepo.delete(id);

      return { result: { message: 'Price deleted successfully' } };
    } catch (error) {
      throw new HttpException(
        { message: 'Error deleting price', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async bulkUpdatePrices(
    updates: Array<{ id: number; price_per_sms?: number; is_active?: boolean }>,
  ): Promise<SingleResponse<{ message: string; updated_count: number }>> {
    try {
      let updated_count: number = 0;

      for (const update of updates) {
        try {
          const updateData: Partial<SmsPriceEntity> = {
            updated_at: new Date(),
          };

          if (update.price_per_sms !== undefined) {
            updateData.price_per_sms = update.price_per_sms;
          }

          if (update.is_active !== undefined) {
            updateData.active = update.is_active;
          }

          await this.priceRepo.update(update.id, updateData);
          updated_count++;
        } catch (error) {
          console.error(`Failed to update price ${update.id}:`, error.message);
        }
      }

      return {
        result: {
          message: 'Bulk update completed',
          updated_count,
        },
      };
    } catch (error) {
      throw new HttpException(
        { message: 'Error performing bulk update', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPriceForOperator(
    operator: OperatorEnum,
    message_type: MessageTypeEnum = MessageTypeEnum.SMS,
  ): Promise<number> {
    try {
      const price = await this.priceRepo.findOne({
        where: {
          operator,
          message_type,
          active: true,
        },
      });

      return price ? price.price_per_sms : 100; // Default price
    } catch (error) {
      return 100; // Default price on error
    }
  }
}
