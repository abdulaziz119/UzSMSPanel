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
import { TariffEntity } from '../entity/tariffs.entity';
import { SingleResponse } from '../utils/dto/dto';
import { PaginationResponse } from '../utils/pagination.response';
import { getPaginationResponse } from '../utils/pagination.builder';
import {
  BulkUpdateTariffPricesDto,
  CreateTariffDto,
  TariffFilterDto,
  UpdateTariffDto,
} from '../utils/dto/tariffs.dto';

@Injectable()
export class TariffService {
  constructor(
    @Inject(MODELS.TARIFFS)
    private readonly tariffRepo: Repository<TariffEntity>,
  ) {}

  async getPublicTariffs(
    filters: TariffFilterDto,
  ): Promise<PaginationResponse<TariffEntity[]>> {
    try {
      const queryBuilder = this.tariffRepo
        .createQueryBuilder('tariff')
        .where('tariff.public = :public', { public: true })
        .select([
          'tariff.id',
          'tariff.code',
          'tariff.name',
          'tariff.phone_ext',
          'tariff.price',
          'tariff.public',
          'tariff.operator',
          'tariff.country_id',
          'tariff.created_at',
          'tariff.updated_at',
        ]);

      // Apply filters
      if (filters.operator) {
        queryBuilder.andWhere('tariff.operator = :operator', {
          operator: filters.operator,
        });
      }

      if (filters.phone_ext) {
        queryBuilder.andWhere('tariff.phone_ext = :phone_ext', {
          phone_ext: filters.phone_ext,
        });
      }

      if (filters.price_from) {
        queryBuilder.andWhere('tariff.price >= :price_from', {
          price_from: filters.price_from,
        });
      }

      if (filters.price_to) {
        queryBuilder.andWhere('tariff.price <= :price_to', {
          price_to: filters.price_to,
        });
      }

      if (filters.search) {
        queryBuilder.andWhere(
          '(tariff.name ILIKE :search OR tariff.operator ILIKE :search)',
          { search: `%${filters.search}%` },
        );
      }

      queryBuilder.orderBy('tariff.price', 'ASC');

      const total: number = await queryBuilder.getCount();

      if (filters.page && filters.limit) {
        queryBuilder
          .skip((filters.page - 1) * filters.limit)
          .take(filters.limit);
      }

      const tariffs: TariffEntity[] = await queryBuilder.getMany();

      return getPaginationResponse(
        tariffs,
        total,
        filters.page || 1,
        filters.limit || 10,
      );
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching public tariffs', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getOperatorList(): Promise<SingleResponse<string[]>> {
    try {
      const operators = await this.tariffRepo
        .createQueryBuilder('tariff')
        .select('DISTINCT tariff.operator', 'operator')
        .where('tariff.public = :public', { public: true })
        .getRawMany();

      const operatorList = operators.map((item) => item.operator);

      return { result: operatorList };
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching operator list', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Dashboard methods
  async findAll(
    filters: TariffFilterDto,
  ): Promise<PaginationResponse<TariffEntity[]>> {
    try {
      const queryBuilder = this.tariffRepo.createQueryBuilder('tariff');

      // Apply filters
      if (filters.operator) {
        queryBuilder.andWhere('tariff.operator = :operator', {
          operator: filters.operator,
        });
      }

      if (filters.phone_ext) {
        queryBuilder.andWhere('tariff.phone_ext = :phone_ext', {
          phone_ext: filters.phone_ext,
        });
      }

      if (filters.public !== undefined) {
        queryBuilder.andWhere('tariff.public = :public', {
          public: filters.public,
        });
      }

      if (filters.price_from) {
        queryBuilder.andWhere('tariff.price >= :price_from', {
          price_from: filters.price_from,
        });
      }

      if (filters.price_to) {
        queryBuilder.andWhere('tariff.price <= :price_to', {
          price_to: filters.price_to,
        });
      }

      if (filters.search) {
        queryBuilder.andWhere(
          '(tariff.name ILIKE :search OR tariff.operator ILIKE :search OR tariff.code ILIKE :search)',
          { search: `%${filters.search}%` },
        );
      }

      queryBuilder
        .orderBy('tariff.operator', 'ASC')
        .addOrderBy('tariff.price', 'ASC');

      const total: number = await queryBuilder.getCount();

      if (filters.page && filters.limit) {
        queryBuilder
          .skip((filters.page - 1) * filters.limit)
          .take(filters.limit);
      }

      const tariffs: TariffEntity[] = await queryBuilder.getMany();

      return getPaginationResponse(
        tariffs,
        total,
        filters.page || 1,
        filters.limit || 10,
      );
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching tariffs', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async create(data: CreateTariffDto): Promise<SingleResponse<TariffEntity>> {
    try {
      const existingTariff: TariffEntity = await this.tariffRepo.findOne({
        where: { code: data.code },
      });

      if (existingTariff) {
        throw new BadRequestException('Tariff with this code already exists');
      }

      // Compute tariff price from provider base (price_provider_sms) and optional margin_percent
      const providerPrice: number = Number(data.price_provider_sms ?? 0);
      const marginPercent: number = Number((data as any).margin_percent ?? 0);
      let computedPrice: number = providerPrice;
      if (!isNaN(marginPercent) && marginPercent !== 0) {
        computedPrice = providerPrice * (1 + marginPercent / 100);
      }
      // Round to 2 decimal places to match DECIMAL(15,2)
      computedPrice = Math.round(Math.max(0, computedPrice) * 100) / 100;

      const tariff: TariffEntity = this.tariffRepo.create({
        code: data.code,
        name: data.name,
        phone_ext: data.phone_ext,
        price: computedPrice,
        price_provider_sms: providerPrice,
        operator: data.operator,
        public: data.public ?? true,
        country_id: data.country_id,
      });

      const savedTariff: TariffEntity = await this.tariffRepo.save(tariff);

      return { result: savedTariff };
    } catch (error) {
      throw new HttpException(
        { message: 'Error creating tariff', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(data: UpdateTariffDto): Promise<SingleResponse<TariffEntity>> {
    try {
      const tariff: TariffEntity = await this.tariffRepo.findOne({
        where: { id: data.id },
      });

      if (!tariff) {
        throw new NotFoundException('Tariff not found');
      }

      if (data.code && data.code !== tariff.code) {
        const existingTariff: TariffEntity = await this.tariffRepo.findOne({
          where: { code: data.code },
        });

        if (existingTariff) {
          throw new BadRequestException('Tariff with this code already exists');
        }
      }

      await this.tariffRepo.update(data.id, {
        ...(data.code && { code: data.code }),
        ...(data.name && { name: data.name }),
        ...(data.phone_ext && { phone_ext: data.phone_ext }),
        ...(data.operator && { operator: data.operator }),
        ...(data.public !== undefined && { public: data.public }),
        updated_at: new Date(),
      });

      const updatedTariff: TariffEntity = await this.tariffRepo.findOne({
        where: { id: data.id },
      });

      return { result: updatedTariff };
    } catch (error) {
      throw new HttpException(
        { message: 'Error updating tariff', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async delete(id: number): Promise<SingleResponse<{ message: string }>> {
    try {
      const tariff: TariffEntity = await this.tariffRepo.findOne({
        where: { id: id },
      });

      if (!tariff) {
        throw new NotFoundException('Tariff not found');
      }

      await this.tariffRepo.delete(id);

      return { result: { message: 'Tariff deleted successfully' } };
    } catch (error) {
      throw new HttpException(
        { message: 'Error deleting tariff', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTariffStatistics(): Promise<SingleResponse<any>> {
    try {
      // Summary statistics using tariff.price and tariff.price_provider_sms
      const statistics = await this.tariffRepo
        .createQueryBuilder('tariff')
        .select([
          'COUNT(*) as total_tariffs',
          'COUNT(CASE WHEN tariff.public = true THEN 1 END) as public_tariffs',
          'COUNT(CASE WHEN tariff.public = false THEN 1 END) as private_tariffs',
          'COUNT(DISTINCT tariff.operator) as total_operators',
          'AVG(tariff.price) as average_price',
          'MIN(tariff.price) as min_price',
          'MAX(tariff.price) as max_price',
          'AVG(tariff.price_provider_sms) as average_provider_price',
          'AVG( (tariff.price - tariff.price_provider_sms) / NULLIF(tariff.price_provider_sms,0) * 100 ) as average_margin_percent',
        ])
        .getRawOne();

      // Operator distribution using tariff columns only
      const operatorStats = await this.tariffRepo
        .createQueryBuilder('tariff')
        .select([
          'tariff.operator as operator',
          'COUNT(*) as tariff_count',
          'AVG(tariff.price) as avg_price',
          'MIN(tariff.price) as min_price',
          'MAX(tariff.price) as max_price',
          'AVG(tariff.price_provider_sms) as avg_provider_price',
          'AVG( (tariff.price - tariff.price_provider_sms) / NULLIF(tariff.price_provider_sms,0) * 100 ) as avg_margin_percent',
        ])
        .groupBy('tariff.operator')
        .orderBy('tariff_count', 'DESC')
        .getRawMany();

      const result = {
        summary: statistics,
        operator_distribution: operatorStats,
      };

      return { result };
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching tariff statistics', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async bulkUpdatePrices(
    data: BulkUpdateTariffPricesDto,
  ): Promise<SingleResponse<{ message: string; affected_count: number }>> {
    try {
      const tariffs: TariffEntity[] = await this.tariffRepo.find({
        where: { operator: (data as any).operator },
      });

      if (tariffs.length === 0) {
        throw new NotFoundException(
          `No tariffs found for operator: ${(data as any).operator}`,
        );
      }

      for (const tariff of tariffs) {
        // Use each tariff's provider base price
        const baseCost: number = Number(tariff.price_provider_sms ?? 0);
        let newPrice: number = baseCost;

        if (data.adjustment_type === 'percent') {
          newPrice = baseCost * (1 + data.price_adjustment / 100);
        } else {
          newPrice = baseCost + data.price_adjustment;
        }

        // Round to 2 decimals (DECIMAL(15,2))
        newPrice = Math.round(Math.max(0, newPrice) * 100) / 100;

        await this.tariffRepo.update(tariff.id, {
          price: newPrice,
          updated_at: new Date(),
        });
      }

      return {
        result: {
          message: `Bulk price update completed for ${(data as any).operator}`,
          affected_count: tariffs.length,
        },
      };
    } catch (error) {
      throw new HttpException(
        { message: 'Error performing bulk price update', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
