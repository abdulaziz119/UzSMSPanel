import {
  Inject,
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { ParamIdDto, SingleResponse } from '../utils/dto/dto';
import { PaginationResponse } from '../utils/pagination.response';
import { getPaginationResponse } from '../utils/pagination.builder';
import { CountryEntity } from '../entity/country.entity';
import {
  CreateCountryDto,
  UpdateCountryDto,
  CountryFilterDto,
} from '../utils/dto/country.dto';

@Injectable()
export class CountryService {
  constructor(
    @Inject(MODELS.COUNTRY)
    private readonly countryRepo: Repository<CountryEntity>,
  ) {}

  async create(
    payload: CreateCountryDto,
  ): Promise<SingleResponse<CountryEntity>> {
    try {
      const country: CountryEntity = this.countryRepo.create(payload);
      const savedCountry: CountryEntity = await this.countryRepo.save(country);

      return {
        result: savedCountry,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create country',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(
    payload: CountryFilterDto,
  ): Promise<PaginationResponse<CountryEntity[]>> {
    const { page = 1, limit = 10, search, is_active } = payload;
    const skip: number = (page - 1) * limit;

    try {
      const queryBuilder = this.countryRepo
        .createQueryBuilder('countries')
        .where('countries.id IS NOT NULL');

      // Add search filter
      if (search) {
        queryBuilder.andWhere(
          '(countries.name ILIKE :search OR countries.code ILIKE :search OR countries.iso_code ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      // Add is_active filter
      if (is_active !== undefined) {
        queryBuilder.andWhere('countries.is_active = :is_active', {
          is_active,
        });
      }

      const [countryData, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .orderBy('countries.name', 'ASC')
        .getManyAndCount();

      return getPaginationResponse<CountryEntity>(
        countryData,
        page,
        limit,
        total,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch countries',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(param: ParamIdDto): Promise<SingleResponse<CountryEntity>> {
    try {
      const country = await this.countryRepo.findOne({
        where: { id: param.id },
        relations: ['tariffs'],
      });

      if (!country) {
        throw new NotFoundException('Country not found');
      }

      return {
        result: country,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch country',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    payload: UpdateCountryDto,
  ): Promise<SingleResponse<CountryEntity>> {
    try {
      const country = await this.countryRepo.findOne({
        where: { id: payload.id },
      });

      if (!country) {
        throw new NotFoundException('Country not found');
      }

      Object.assign(country, payload);
      const updatedCountry = await this.countryRepo.save(country);

      return {
        result: updatedCountry,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update country',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async delete(param: ParamIdDto): Promise<{ result: true }> {
    try {
      const country = await this.countryRepo.findOne({
        where: { id: param.id },
      });

      if (!country) {
        throw new NotFoundException('Country not found');
      }

      await this.countryRepo.remove(country);

      return { result: true };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete country',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
