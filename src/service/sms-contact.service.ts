import {
  Inject,
  Injectable,
  HttpException,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { MODELS } from '../constants/constants';
import { PaginationParams, ParamIdDto, SingleResponse } from '../utils/dto/dto';
import { PaginationResponse } from '../utils/pagination.response';
import { getPaginationResponse } from '../utils/pagination.builder';
import { SmsContactEntity } from '../entity/sms-contact.entity';
import {
  CreateSmsContactDto,
  UpdateSmsContactDto,
} from '../utils/dto/sms-contact.dto';
import { SMSContactStatusEnum } from '../utils/enum/sms-contact.enum';

@Injectable()
export class SmsContactService {
  constructor(
    @Inject(MODELS.SMS_CONTACT)
    private readonly smsContactRepo: Repository<SmsContactEntity>,
  ) {}

  /**
   * Normalize and validate phone globally via libphonenumber-js and map to status
   */
  private validatePhoneNumber(phone: string): SMSContactStatusEnum {
    const cleanPhone = (phone || '').toString().trim();
    const bannedPatterns = [/666/, /999/, /000{3,}/];
    if (bannedPatterns.some((p) => p.test(cleanPhone))) {
      return SMSContactStatusEnum.BANNED_NUMBER;
    }

    try {
      let parsed = parsePhoneNumberFromString(cleanPhone);
      if (!parsed) {
        parsed = parsePhoneNumberFromString(cleanPhone, 'UZ');
      }

      if (parsed && parsed.isValid()) {
        return SMSContactStatusEnum.ACTIVE;
      }
      return SMSContactStatusEnum.INVALID_FORMAT;
    } catch {
      return SMSContactStatusEnum.INVALID_FORMAT;
    }
  }

  /** Normalize phone to E.164 if valid, otherwise return original */
  private normalizePhone(phone: string): string {
    try {
      let parsed = parsePhoneNumberFromString(phone);
      if (!parsed) parsed = parsePhoneNumberFromString(phone, 'UZ');
      if (parsed && parsed.isValid()) {
        return parsed.number;
      }
    } catch {}
    return phone;
  }

  async create(
    payload: CreateSmsContactDto,
  ): Promise<SingleResponse<SmsContactEntity>> {
    try {
      // Automatically determine status based on phone number validation
      const status = this.validatePhoneNumber(payload.phone);

      const newSmsContact: SmsContactEntity = this.smsContactRepo.create({
        name: payload.name,
        phone: this.normalizePhone(payload.phone),
        status: status,
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
      if (updateData.phone) {
        updateData.status = this.validatePhoneNumber(updateData.phone);
      }

      await this.smsContactRepo.update(id, updateData);
      const updatedSmsContact = await this.smsContactRepo.findOne({
        where: { id: id },
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
