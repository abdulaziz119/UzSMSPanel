import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { TariffEntity } from '../entity/tariffs.entity';
import { TariffStatusEnum } from '../utils/enum/tariff.enum';
import { PaginationBuilder } from '../utils/pagination.builder';
import { PaginationResponse } from '../utils/pagination.response';
import { SingleResponse } from '../utils/dto/dto';
import {
  CreateTariffDto,
  TariffFilters,
  UpdateTariffDto,
} from '../utils/interfaces/tariffs.interface';

@Injectable()
export class TariffsService {
  private readonly logger = new Logger(TariffsService.name);

  constructor(
    @Inject(MODELS.TARIFFS)
    private readonly tariffRepo: Repository<TariffEntity>,
  ) {}

  async createTariff(
    payload: CreateTariffDto,
  ): Promise<SingleResponse<TariffEntity>> {
    try {
      const existingTariff: TariffEntity = await this.tariffRepo.findOne({
        where: { operator: payload.operator },
      });

      if (existingTariff) {
        throw new HttpException(
          'Tariff for this operator already exists',
          HttpStatus.CONFLICT,
        );
      }

      const newTariff: TariffEntity = this.tariffRepo.create({
        ...payload,
        currency: payload.currency || 'UZS',
        status: payload.status || TariffStatusEnum.ACTIVE,
        is_default: payload.is_default || false,
      });

      const result: TariffEntity = await this.tariffRepo.save(newTariff);

      this.logger.log(`New tariff created: ${result.id}`);
      return { result };
    } catch (error: any) {
      throw new HttpException(
        `Failed to create tariff: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllTariffs(
    page: number = 1,
    limit: number = 10,
    filters?: TariffFilters,
  ): Promise<PaginationResponse<TariffEntity[]>> {
    try {
      const query = this.tariffRepo.createQueryBuilder('tariff');

      if (filters?.operator) {
        query.andWhere('tariff.operator ILIKE :operator', {
          operator: `%${filters.operator}%`,
        });
      }

      if (filters?.min_price) {
        query.andWhere('tariff.price_per_sms >= :min_price', {
          min_price: filters.min_price,
        });
      }

      if (filters?.max_price) {
        query.andWhere('tariff.price_per_sms <= :max_price', {
          max_price: filters.max_price,
        });
      }

      if (filters?.currency) {
        query.andWhere('tariff.currency = :currency', {
          currency: filters.currency,
        });
      }

      if (filters?.status) {
        query.andWhere('tariff.status = :status', {
          status: filters.status,
        });
      }

      if (filters?.is_default !== undefined) {
        query.andWhere('tariff.is_default = :is_default', {
          is_default: filters.is_default,
        });
      }

      query.orderBy('tariff.price_per_sms', 'ASC');

      const [tariffs, total] = await query
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return PaginationBuilder.build(tariffs, page, limit, total);
    } catch (error: any) {
      throw new HttpException(
        `Failed to get tariffs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTariffById(id: number): Promise<SingleResponse<TariffEntity>> {
    try {
      const tariff: TariffEntity = await this.tariffRepo.findOne({
        where: { id },
      });

      if (!tariff) {
        throw new HttpException('Tariff not found', HttpStatus.NOT_FOUND);
      }

      return { result: tariff };
    } catch (error: any) {
      throw new HttpException(
        `Failed to get tariff: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTariffByOperator(
    operator: string,
  ): Promise<SingleResponse<TariffEntity>> {
    try {
      const tariff: TariffEntity = await this.tariffRepo.findOne({
        where: { operator },
      });

      if (!tariff) {
        throw new HttpException('Tariff not found', HttpStatus.NOT_FOUND);
      }

      return { result: tariff };
    } catch (error: any) {
      throw new HttpException(
        `Failed to get tariff by operator: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateTariff(
    id: number,
    payload: UpdateTariffDto,
  ): Promise<SingleResponse<TariffEntity>> {
    try {
      const tariff: TariffEntity = await this.tariffRepo.findOne({
        where: { id },
      });

      if (!tariff) {
        throw new HttpException('Tariff not found', HttpStatus.NOT_FOUND);
      }

      if (payload.operator && payload.operator !== tariff.operator) {
        const existingTariff: TariffEntity = await this.tariffRepo.findOne({
          where: { operator: payload.operator },
        });

        if (existingTariff) {
          throw new HttpException(
            'Tariff for this operator already exists',
            HttpStatus.CONFLICT,
          );
        }
      }

      Object.assign(tariff, payload);
      const result = await this.tariffRepo.save(tariff);

      this.logger.log(`Tariff updated: ${result.id}`);
      return { result };
    } catch (error: any) {
      throw new HttpException(
        `Failed to update tariff: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteTariff(id: number): Promise<SingleResponse<{ message: string }>> {
    try {
      const tariff: TariffEntity = await this.tariffRepo.findOne({
        where: { id },
      });

      if (!tariff) {
        throw new HttpException('Tariff not found', HttpStatus.NOT_FOUND);
      }

      await this.tariffRepo.softDelete(id);

      this.logger.log(`Tariff deleted: ${id}`);
      return { result: { message: 'Tariff deleted successfully' } };
    } catch (error: any) {
      throw new HttpException(
        `Failed to delete tariff: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAvailableOperators(): Promise<SingleResponse<string[]>> {
    try {
      const operators = await this.tariffRepo
        .createQueryBuilder('tariff')
        .select('DISTINCT tariff.operator', 'operator')
        .getRawMany();

      const operatorList = operators.map((item) => item.operator);

      return { result: operatorList };
    } catch (error: any) {
      throw new HttpException(
        `Failed to get available operators: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCheapestTariff(): Promise<SingleResponse<TariffEntity | null>> {
    try {
      const tariff: TariffEntity = await this.tariffRepo
        .createQueryBuilder('tariff')
        .orderBy('tariff.price_per_sms', 'ASC')
        .getOne();

      return { result: tariff };
    } catch (error: any) {
      throw new HttpException(
        `Failed to get cheapest tariff: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTariffStatistics(): Promise<
    SingleResponse<{
      total_tariffs: number;
      average_price: number;
      min_price: number;
      max_price: number;
      operators_count: number;
    }>
  > {
    try {
      const [stats] = await this.tariffRepo
        .createQueryBuilder('tariff')
        .select([
          'COUNT(*) as total_tariffs',
          'AVG(tariff.price_per_sms) as average_price',
          'MIN(tariff.price_per_sms) as min_price',
          'MAX(tariff.price_per_sms) as max_price',
          'COUNT(DISTINCT tariff.operator) as operators_count',
        ])
        .getRawOne();

      return {
        result: {
          total_tariffs: parseInt(stats.total_tariffs),
          average_price: parseFloat(stats.average_price) || 0,
          min_price: parseFloat(stats.min_price) || 0,
          max_price: parseFloat(stats.max_price) || 0,
          operators_count: parseInt(stats.operators_count),
        },
      };
    } catch (error: any) {
      throw new HttpException(
        `Failed to get tariff statistics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async calculateSmsPrice(
    operator: string,
    smsCount: number,
  ): Promise<SingleResponse<{ total_price: number; operator: string }>> {
    try {
      const tariff: TariffEntity = await this.tariffRepo.findOne({
        where: { operator },
      });

      if (!tariff) {
        throw new HttpException(
          'Tariff for this operator not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const total_price: number = tariff.price_per_sms * smsCount;

      return {
        result: {
          total_price,
          operator: tariff.operator,
        },
      };
    } catch (error: any) {
      throw new HttpException(
        `Failed to calculate SMS price: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
