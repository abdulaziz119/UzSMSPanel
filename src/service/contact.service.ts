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
import { ContactEntity } from '../entity/contact.entity';
import { CreateContactDto } from '../utils/dto/contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @Inject(MODELS.CONTACT)
    private readonly contactRepo: Repository<ContactEntity>,
  ) {}

  async create(
    payload: CreateContactDto,
    user_id: number,
  ): Promise<SingleResponse<ContactEntity>> {
    try {
      const newContact: ContactEntity = this.contactRepo.create({
        ...payload,
        user_id,
      });

      const savedContact: ContactEntity =
        await this.contactRepo.save(newContact);
      return { result: savedContact };
    } catch (error) {
      throw new HttpException(
        { message: 'Error creating contact', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(
    payload: PaginationParams,
  ): Promise<PaginationResponse<ContactEntity[]>> {
    const { page = 1, limit = 10 } = payload;
    const skip = (page - 1) * limit;

    try {
      const queryBuilder = this.contactRepo
        .createQueryBuilder('orders')
        .where('orders.id IS NOT NULL');

      const [orderData, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .orderBy('orders.created_at', 'DESC')
        .getManyAndCount();

      return getPaginationResponse<ContactEntity>(
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

  async findOne(payload: ParamIdDto): Promise<SingleResponse<ContactEntity>> {
    const order: ContactEntity = await this.contactRepo.findOne({
      where: { id: payload.id },
    });

    if (!order) {
      throw new NotFoundException('Contact not found');
    }

    return { result: order };
  }

  async delete(payload: ParamIdDto): Promise<{ result: true }> {
    const { id } = payload;
    await this.contactRepo.softDelete(id);
    return { result: true };
  }
}
