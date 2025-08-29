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
import { AxiosService } from '../helpers/axios.service';
import { MY_GO_URL } from '../utils/env/env';

@Injectable()
export class ContactService {
  private url: string = MY_GO_URL;
  constructor(
    @Inject(MODELS.CONTACT)
    private readonly contactRepo: Repository<ContactEntity>,
    @Inject(MODELS.USER)
    private readonly userRepo: Repository<UserEntity>,
    private readonly axiosService: AxiosService,
  ) {}

  async createIndividual(
    payload: CreateIndividualContactDto,
    user_id: number,
  ): Promise<
    SingleResponse<{
      id: number;
      first_name: string;
      last_name: string;
      middle_name: string;
    }>
  > {
    try {
      const userData: UserEntity = await this.userRepo.findOne({
        where: { id: user_id },
      });

      if (!userData) {
        throw new NotFoundException('User not found');
      }

      const contactData: ContactEntity = await this.contactRepo.findOne({
        where: {
          user_id: user_id,
          type: ContactTypeEnum.INDIVIDUAL,
        },
      });

      if (contactData) {
        throw new HttpException(
          { message: 'Contact already exists' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const url: string = `${this.url}/myid/getByIdnCode/${payload.code}`;
      const myGo: any = await this.axiosService.sendGetRequest(url);

      if (!myGo) {
        throw new HttpException(
          { message: 'Error fetching data from MyGo' },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const newContact: ContactEntity = this.contactRepo.create({
        address: myGo.address,
        contacts: myGo.contacts,
        docData: myGo.docData,
        commonData: myGo.commonData,
        my_go_updated_at: myGo.updated_at,
        my_go_created_at: myGo.created_at,
        job_id: myGo.job_id,
        refresh_token: myGo.refresh_token,
        access_token: myGo.access_token,
        success: myGo.success,
        step_error: myGo.step_error,
        step_result: myGo.step_result,
        step_type: myGo.step_type,
        step: myGo.step,
        code: myGo.code,
        code_from: myGo.code_from,
        method_type: myGo.method_type,
        identity_code: myGo.identity_code,
        my_go_id: myGo.id,
        user_id: user_id,
        type: ContactTypeEnum.INDIVIDUAL,
        company_name: null,
        company_bank_name: null,
        company_bank_id: null,
        company_inn: null,
        company_mfo: null,
        company_okonx: null,
      });

      const savedContact: ContactEntity =
        await this.contactRepo.save(newContact);

      const result = {
        id: savedContact.id,
        first_name: savedContact.commonData.first_name,
        last_name: savedContact.commonData.last_name,
        middle_name: savedContact.commonData.middle_name,
      };
      return { result: result };
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
        // ...payload,
        // user_id,
        // type: ContactTypeEnum.COMPANY,
        // phone: userData.phone,
        // phone_ext: userData.phone_ext || '998',
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
