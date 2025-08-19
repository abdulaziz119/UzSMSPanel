import {
  Inject,
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { SenderPriceEntity } from '../entity/sender-price.entity';
import {
  CreateSenderPriceDto,
  UpdateSenderPriceDto,
  SenderPriceFilterDto,
} from '../utils/dto/sender-price.dto';
import { SingleResponse, ParamIdDto, PaginationParams } from '../utils/dto/dto';
import { PaginationResponse } from '../utils/pagination.response';
import { getPaginationResponse } from '../utils/pagination.builder';

@Injectable()
export class SenderPriceService {
  constructor(
    @Inject(MODELS.SENDER_PRICE)
    private readonly senderPriceRepo: Repository<SenderPriceEntity>,
  ) {}

  async create(
    payload: CreateSenderPriceDto,
  ): Promise<SingleResponse<SenderPriceEntity>> {
    try {
      // Operator kodi unique ekanligini tekshirish
      const existingOperator = await this.senderPriceRepo.findOne({
        where: { operator: payload.operator },
      });

      if (existingOperator) {
        throw new ConflictException(
          `Operator kodi "${payload.operator}" allaqachon mavjud`,
        );
      }

      const entity = this.senderPriceRepo.create({
        operator: payload.operator,
        operator_name: payload.operator_name,
        monthly_fee: payload.monthly_fee,
        currency: payload.currency ?? 'UZS',
        active: payload.active ?? true,
        description: payload.description ?? null,
      });

      const saved = await this.senderPriceRepo.save(entity);
      return { result: saved };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new HttpException(
        { message: 'Error creating sender price', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(
    query: SenderPriceFilterDto,
  ): Promise<PaginationResponse<SenderPriceEntity[]>> {
    const { page = 1, limit = 10, operator, active, search, price_from, price_to } = query;
    const skip: number = (page - 1) * limit;

    const qb = this.senderPriceRepo
      .createQueryBuilder('sender_price')
      .where('sender_price.id is not null');

    // Operator filter
    if (operator) {
      qb.andWhere('sender_price.operator = :operator', { operator });
    }

    // Active filter
    if (active !== undefined) {
      qb.andWhere('sender_price.active = :active', { active });
    }

    // Search filter
    if (search) {
      qb.andWhere(
        '(sender_price.operator ILIKE :search OR sender_price.operator_name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Price range filter
    if (price_from !== undefined) {
      qb.andWhere('sender_price.monthly_fee >= :price_from', { price_from });
    }

    if (price_to !== undefined) {
      qb.andWhere('sender_price.monthly_fee <= :price_to', { price_to });
    }

    const [items, total] = await qb
      .skip(skip)
      .take(limit)
      .orderBy('sender_price.created_at', 'DESC')
      .getManyAndCount();

    return getPaginationResponse(items, page, limit, total);
  }

  async findOne(params: ParamIdDto): Promise<SingleResponse<SenderPriceEntity>> {
    const found = await this.senderPriceRepo.findOne({
      where: { id: params.id },
      relations: ['smsSenders'],
    });

    if (!found) {
      throw new NotFoundException('Sender price not found');
    }

    return { result: found };
  }

  async update(
    body: UpdateSenderPriceDto,
  ): Promise<SingleResponse<SenderPriceEntity>> {
    const found = await this.senderPriceRepo.findOne({
      where: { id: body.id },
    });

    if (!found) {
      throw new NotFoundException('Sender price not found');
    }

    // Agar operator kodi o'zgartirilayotgan bo'lsa, unique ekanligini tekshirish
    if (body.operator && body.operator !== found.operator) {
      const existingOperator = await this.senderPriceRepo.findOne({
        where: { operator: body.operator },
      });

      if (existingOperator) {
        throw new ConflictException(
          `Operator kodi "${body.operator}" allaqachon mavjud`,
        );
      }
    }

    await this.senderPriceRepo.update(body.id, {
      operator: body.operator,
      operator_name: body.operator_name,
      monthly_fee: body.monthly_fee,
      currency: body.currency,
      active: body.active,
      description: body.description,
    });

    const updated = await this.senderPriceRepo.findOne({
      where: { id: body.id },
      relations: ['smsSenders'],
    });

    return { result: updated };
  }

  async delete(params: ParamIdDto): Promise<SingleResponse<boolean>> {
    const found = await this.senderPriceRepo.findOne({
      where: { id: params.id },
      relations: ['smsSenders'],
    });

    if (!found) {
      throw new NotFoundException('Sender price not found');
    }

    // Agar sender price ishlatilayotgan bo'lsa, o'chirib bo'lmaydi
    if (found.smsSenders && found.smsSenders.length > 0) {
      throw new ConflictException(
        'Bu sender price ishlatilmoqda, o\'chirib bo\'lmaydi',
      );
    }

    await this.senderPriceRepo.delete(params.id);
    return { result: true };
  }

  // Barcha faol sender price'larni olish (dropdown uchun)
  async getActivePrices(): Promise<SingleResponse<SenderPriceEntity[]>> {
    const prices = await this.senderPriceRepo.find({
      where: { active: true },
      order: { operator_name: 'ASC' },
    });

    return { result: prices };
  }
}
