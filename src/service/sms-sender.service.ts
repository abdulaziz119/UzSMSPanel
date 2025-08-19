import {
  Inject,
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { SmsSenderEntity } from '../entity/sms-sender.entity';
import {
  CreateSmsSenderDto,
  UpdateSmsSenderDto,
} from '../utils/dto/sms-sender.dto';
import { SingleResponse, PaginationParams } from '../utils/dto/dto';
import { PaginationResponse } from '../utils/pagination.response';
import { getPaginationResponse } from '../utils/pagination.builder';

@Injectable()
export class SmsSenderService {
  constructor(
    @Inject(MODELS.SMS_SENDER)
    private readonly smsSenderRepo: Repository<SmsSenderEntity>,
  ) {}

  async create(
    payload: CreateSmsSenderDto,
    user_id: number,
  ): Promise<SingleResponse<SmsSenderEntity>> {
    try {
      const entity = this.smsSenderRepo.create({
        user_id,
        name: payload.name,
        description: payload.description ?? null,
        links: payload.links ?? null,
        sender_price_id: payload.sender_price_id,
      });
      const saved = await this.smsSenderRepo.save(entity);
      return { result: saved };
    } catch (error) {
      throw new HttpException(
        { message: 'Error creating sender', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(
    query: PaginationParams,
  ): Promise<PaginationResponse<SmsSenderEntity[]>> {
    const { page = 1, limit = 10 } = query;
    const skip: number = (page - 1) * limit;
    const qb = this.smsSenderRepo
      .createQueryBuilder('sms_senders')
      .leftJoinAndSelect('sms_senders.senderPrice', 'sender_price')
      .where('sms_senders.id is not null');
    const [items, total] = await qb
      .skip(skip)
      .take(limit)
      .orderBy('sms_senders.created_at', 'DESC')
      .getManyAndCount();
    return getPaginationResponse(items, page, limit, total);
  }

  async update(
    body: UpdateSmsSenderDto,
  ): Promise<SingleResponse<SmsSenderEntity>> {
    const found = await this.smsSenderRepo.findOne({ where: { id: body.id } });
    if (!found) throw new NotFoundException('Sender not found');
    await this.smsSenderRepo.update(body.id, body);
    const updated = await this.smsSenderRepo.findOne({
      where: { id: body.id },
      relations: ['senderPrice'],
    });
    return { result: updated };
  }
}
