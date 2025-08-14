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

      const total = await queryBuilder.getCount();

      if (filters.page && filters.limit) {
        queryBuilder
          .skip((filters.page - 1) * filters.limit)
          .take(filters.limit);
      }

      const tariffs = await queryBuilder.getMany();

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

      const total = await queryBuilder.getCount();

      if (filters.page && filters.limit) {
        queryBuilder
          .skip((filters.page - 1) * filters.limit)
          .take(filters.limit);
      }

      const tariffs = await queryBuilder.getMany();

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

      // Agar margin_percent berilsa, yakuniy price = cost_price * (1 + margin/100)
      const computedPrice =
        data.margin_percent !== undefined && data.margin_percent !== null
          ? Math.max(
              0,
              Number(data.cost_price) * (1 + Number(data.margin_percent) / 100),
            )
          : data.price;

      const tariff: TariffEntity = this.tariffRepo.create({
        code: data.code,
        name: data.name,
        phone_ext: data.phone_ext,
        price: computedPrice,
        cost_price: data.cost_price,
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

      // Check if code is being changed and if it already exists
      if (data.code && data.code !== tariff.code) {
        const existingTariff: TariffEntity = await this.tariffRepo.findOne({
          where: { code: data.code },
        });

        if (existingTariff) {
          throw new BadRequestException('Tariff with this code already exists');
        }
      }

      // Agar margin_percent berilsa, mavjud yoki kelgan cost_price asosida price qayta hisoblanadi
      let nextPrice = data.price;
      let nextCost = data.cost_price;
      if (data.margin_percent !== undefined) {
        const baseCost = nextCost !== undefined ? nextCost : tariff.cost_price;
        nextPrice = Math.max(
          0,
          Number(baseCost) * (1 + Number(data.margin_percent) / 100),
        );
      }

      await this.tariffRepo.update(data.id, {
        ...(data.code && { code: data.code }),
        ...(data.name && { name: data.name }),
        ...(data.phone_ext && { phone_ext: data.phone_ext }),
        ...(nextCost !== undefined && { cost_price: nextCost }),
        ...(nextPrice !== undefined && { price: nextPrice }),
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
        where: { id },
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
      const statistics = await this.tariffRepo
        .createQueryBuilder('tariff')
        .select([
          'COUNT(*) as total_tariffs',
          'COUNT(CASE WHEN public = true THEN 1 END) as public_tariffs',
          'COUNT(CASE WHEN public = false THEN 1 END) as private_tariffs',
          'COUNT(DISTINCT operator) as total_operators',
          'AVG(price) as average_price',
          'MIN(price) as min_price',
          'MAX(price) as max_price',
        ])
        .getRawOne();

      // Get operator distribution
      const operatorStats = await this.tariffRepo
        .createQueryBuilder('tariff')
        .select([
          'operator',
          'COUNT(*) as tariff_count',
          'AVG(price) as avg_price',
          'MIN(price) as min_price',
          'MAX(price) as max_price',
        ])
        .groupBy('operator')
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

  async bulkUpdatePrices(data: {
    operator: string;
    price_adjustment: number;
    adjustment_type: 'percent' | 'fixed';
  }): Promise<SingleResponse<{ message: string; affected_count: number }>> {
    try {
      const tariffs = await this.tariffRepo.find({
        where: { operator: data.operator },
      });

      if (tariffs.length === 0) {
        throw new NotFoundException(
          `No tariffs found for operator: ${data.operator}`,
        );
      }

      for (const tariff of tariffs) {
        // Hisob-kitob bazaviy tan narx (cost_price) asosida bo'ladi
        const baseCost = (tariff as any).cost_price ?? tariff.price ?? 0;
        let newPrice = baseCost;

        if (data.adjustment_type === 'percent') {
          newPrice = baseCost * (1 + data.price_adjustment / 100);
        } else {
          newPrice = baseCost + data.price_adjustment;
        }

        // 4 ta kasr belgigacha yaxlitlash (DECIMAL(15,4) bilan mos)
        newPrice = Math.round(Math.max(0, newPrice) * 10000) / 10000;

        await this.tariffRepo.update(tariff.id, {
          price: newPrice,
          updated_at: new Date(),
        });
      }

      return {
        result: {
          message: `Bulk price update completed for ${data.operator}`,
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
