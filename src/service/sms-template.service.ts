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
import { SmsTemplateEntity } from '../entity/sms-template.entity';
import {
  CreateSmsTemplateDto,
  UpdateSmsTemplateDto,
} from '../utils/dto/sms-template.dto';
import { TemplateStatusEnum } from '../utils/enum/sms-template.enum';

@Injectable()
export class SmsTemplateService {
  constructor(
    @Inject(MODELS.SMS_TEMPLATE)
    private readonly smsTemplateRepo: Repository<SmsTemplateEntity>,
  ) {}

  async create(
    payload: CreateSmsTemplateDto,
    user_id: number,
  ): Promise<SingleResponse<SmsTemplateEntity>> {
    try {
      const newSmsTemplate: SmsTemplateEntity = this.smsTemplateRepo.create({
        name: payload.name,
        content: payload.content,
  sender_id: payload.sender_id || null,
        description: payload.description || null,
        variables: payload.variables || null,
        user_id: user_id,
        status: TemplateStatusEnum.PENDING_APPROVAL,
        usage_count: 0,
        last_used_at: null,
        rejection_reason: null,
      });

      const savedSmsTemplate: SmsTemplateEntity =
        await this.smsTemplateRepo.save(newSmsTemplate);
      return { result: savedSmsTemplate };
    } catch (error) {
      throw new HttpException(
        { message: 'Error creating SMS Template', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(
    payload: PaginationParams,
  ): Promise<PaginationResponse<SmsTemplateEntity[]>> {
    const { page = 1, limit = 10 } = payload;
    const skip: number = (page - 1) * limit;

    try {
      const queryBuilder = this.smsTemplateRepo
        .createQueryBuilder('sms_templates')
        .leftJoinAndSelect('sms_templates.user', 'user')
        .leftJoinAndSelect('sms_templates.sender', 'sender')
        .where('sms_templates.id IS NOT NULL');

      const [smsTemplateData, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .orderBy('sms_templates.created_at', 'DESC')
        .getManyAndCount();

      return getPaginationResponse<SmsTemplateEntity>(
        smsTemplateData,
        page,
        limit,
        total,
      );
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching SMS Templates', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(
    payload: ParamIdDto,
  ): Promise<SingleResponse<SmsTemplateEntity>> {
    const smsTemplate: SmsTemplateEntity = await this.smsTemplateRepo.findOne({
      where: { id: payload.id },
      relations: ['user', 'sender'],
    });

    if (!smsTemplate) {
      throw new NotFoundException('SMS Template not found');
    }

    return { result: smsTemplate };
  }

  async update(
    updateData: UpdateSmsTemplateDto,
    user_id: number,
  ): Promise<SingleResponse<SmsTemplateEntity>> {
    const smsTemplate = await this.smsTemplateRepo.findOne({
      where: { id: updateData.id, user_id: user_id },
    });

    if (!smsTemplate) {
      throw new NotFoundException('SMS Template not found');
    }

    try {
      await this.smsTemplateRepo.update(updateData.id, updateData);
      const updatedSmsTemplate = await this.smsTemplateRepo.findOne({
        where: { id: updateData.id },
        relations: ['user', 'sender'],
      });
      return { result: updatedSmsTemplate };
    } catch (error) {
      throw new HttpException(
        { message: 'Error updating SMS Template', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async delete(payload: ParamIdDto): Promise<{ result: true }> {
    const { id } = payload;
    const smsTemplate = await this.smsTemplateRepo.findOne({
      where: { id },
    });

    if (!smsTemplate) {
      throw new NotFoundException('SMS Template not found');
    }

    await this.smsTemplateRepo.softDelete(id);
    return { result: true };
  }

  async updateUsageCount(templateId: number): Promise<void> {
    await this.smsTemplateRepo.update(templateId, {
      usage_count: () => 'usage_count + 1',
      last_used_at: new Date(),
    });
  }
}
