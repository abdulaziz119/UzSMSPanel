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
import {
  CreateIndividualContactDto,
  CreateCompanyContactDto,
} from '../utils/dto/contact.dto';
import { ContactTypeEnum } from '../utils/enum/contact.enum';
import { UserEntity } from '../entity/user.entity';

@Injectable()
export class ContactService {
  constructor(
    @Inject(MODELS.CONTACT)
    private readonly contactRepo: Repository<ContactEntity>,
    @Inject(MODELS.USER)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async createIndividual(
    payload: CreateIndividualContactDto,
    user_id: number,
  ): Promise<SingleResponse<ContactEntity>> {
    try {
      const userData: UserEntity = await this.userRepo.findOne({
        where: { id: user_id },
      });

      if (!userData) {
        throw new NotFoundException('User not found');
      }

      const contactData: ContactEntity = await this.contactRepo.findOne({
        where: {
          id: user_id,
          type: ContactTypeEnum.INDIVIDUAL,
        },
      });

      if (contactData) {
        throw new HttpException(
          { message: 'Contact already exists' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const newContact: ContactEntity = this.contactRepo.create({
        ...payload,
        user_id,
        type: ContactTypeEnum.INDIVIDUAL,
        phone: userData.phone,
        phone_ext: userData.phone_ext,
        company_name: null,
        company_bank_name: null,
        company_bank_id: null,
        company_inn: null,
        company_mfo: null,
        company_okonx: null,
      });

      const savedContact: ContactEntity =
        await this.contactRepo.save(newContact);
      return { result: savedContact };
    } catch (error) {
      throw new HttpException(
        { message: 'Error creating individual contact', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createCompany(
    payload: CreateCompanyContactDto,
    user_id: number,
  ): Promise<SingleResponse<ContactEntity>> {
    try {
      const userData: UserEntity = await this.userRepo.findOne({
        where: { id: user_id },
      });

      if (!userData) {
        throw new NotFoundException('User not found');
      }

      const contactData: ContactEntity = await this.contactRepo.findOne({
        where: {
          id: user_id,
          type: ContactTypeEnum.COMPANY,
          company_inn: payload.company_inn,
        },
      });

      if (contactData) {
        throw new HttpException(
          { message: 'Contact already exists' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const newContact: ContactEntity = this.contactRepo.create({
        ...payload,
        user_id,
        type: ContactTypeEnum.COMPANY,
        phone: userData.phone,
        phone_ext: userData.phone_ext || '998',
        birth_year: null,
        passport_seria: null,
        passport_number: null,
        passport_given_by: null,
        passport_expiration_date: null,
        passport_file_id: null,
        address_file_id: null,
      });

      const savedContact: ContactEntity =
        await this.contactRepo.save(newContact);
      return { result: savedContact };
    } catch (error) {
      throw new HttpException(
        { message: 'Error creating company contact', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(
    payload: PaginationParams,
  ): Promise<PaginationResponse<ContactEntity[]>> {
    const { page = 1, limit = 10 } = payload;
    const skip: number = (page - 1) * limit;

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
