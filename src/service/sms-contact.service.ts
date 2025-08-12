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
import { SmsContactEntity } from '../entity/sms-contact.entity';
import {
  CreateSmsContactDto,
  UpdateSmsContactDto,
} from '../utils/dto/sms-contact.dto';

@Injectable()
export class SmsContactService {
  constructor(
    @Inject(MODELS.SMS_CONTACT)
    private readonly smsContactRepo: Repository<SmsContactEntity>,
  ) {}

  async create(
    payload: CreateSmsContactDto,
  ): Promise<SingleResponse<SmsContactEntity>> {
    try {
      const newSmsContact: SmsContactEntity = this.smsContactRepo.create({
        name: payload.name,
        phone: payload.phone,
        group_name: payload.group_name,
        group_id: payload.group_id,
      });

      const savedSmsContact: SmsContactEntity =
        await this.smsContactRepo.save(newSmsContact);
      return { result: savedSmsContact };
    } catch (error) {
      throw new HttpException(
        { message: 'Error creating SMS Contact', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(
    payload: PaginationParams,
  ): Promise<PaginationResponse<SmsContactEntity[]>> {
    const { page = 1, limit = 10 } = payload;
    const skip = (page - 1) * limit;

    try {
      const queryBuilder = this.smsContactRepo
        .createQueryBuilder('sms_contacts')
        .where('sms_contacts.id IS NOT NULL')
        .addSelect(['sms_contacts.phone']); // Explicitly select phone field

      const [smsContactData, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .orderBy('sms_contacts.created_at', 'DESC')
        .getManyAndCount();

      return getPaginationResponse<SmsContactEntity>(
        smsContactData,
        page,
        limit,
        total,
      );
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching SMS Contacts', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(
    payload: ParamIdDto,
  ): Promise<SingleResponse<SmsContactEntity>> {
    const smsContact: SmsContactEntity = await this.smsContactRepo.findOne({
      where: { id: payload.id },
      relations: ['smsGroup'],
    });

    if (!smsContact) {
      throw new NotFoundException('SMS Contact not found');
    }

    return { result: smsContact };
  }

  async update(
    payload: UpdateSmsContactDto,
  ): Promise<SingleResponse<SmsContactEntity>> {
    const { id, ...updateData } = payload as any;

    const smsContact = await this.smsContactRepo.findOne({
      where: { id: id },
    });

    if (!smsContact) {
      throw new NotFoundException('SMS Contact not found');
    }

    try {
      await this.smsContactRepo.update(id, updateData);
      const updatedSmsContact = await this.smsContactRepo.findOne({
        where: { id: id },
        relations: ['smsGroup'],
      });
      return { result: updatedSmsContact };
    } catch (error) {
      throw new HttpException(
        { message: 'Error updating SMS Contact', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async delete(payload: ParamIdDto): Promise<{ result: true }> {
    const { id } = payload;
    await this.smsContactRepo.softDelete(id);
    return { result: true };
  }
}
