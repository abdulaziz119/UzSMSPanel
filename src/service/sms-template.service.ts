import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { ParamIdDto, SingleResponse } from '../utils/dto/dto';
import { PaginationResponse } from '../utils/pagination.response';
import { getPaginationResponse } from '../utils/pagination.builder';
import { SmsTemplateEntity } from '../entity/sms-template.entity';
import {
  CreateSmsTemplateDto,
  UpdateSmsTemplateDto,
} from '../utils/dto/sms-template.dto';
import { TemplateStatusEnum } from '../utils/enum/sms-template.enum';
import { SmsTemplateFrontendFilterDto } from '../frontend/v1/modules/sms-template/dto/sms-template.dto';
import { SmsTemplateDashboardFilterDto } from '../dashboard/v1/modules/sms-template/dto/sms-template.dto';
import { analyzeSmsContent } from '../utils/sms-counter.util';

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
        user_id: user_id,
        status: TemplateStatusEnum.PENDING_APPROVAL,
        usage_count: 0,
        last_used_at: null,
        rejection_reason: null,
      });
      const info = analyzeSmsContent(payload.content || '');
      newSmsTemplate.content_length = info.length;
      newSmsTemplate.parts_count = info.parts;

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
    payload: SmsTemplateFrontendFilterDto | SmsTemplateDashboardFilterDto,
    user_id?: number,
  ): Promise<PaginationResponse<SmsTemplateEntity[]>> {
    const { page = 1, limit = 10, search, status } = payload;
    const skip: number = (page - 1) * limit;

    try {
      const queryBuilder = this.smsTemplateRepo
        .createQueryBuilder('sms_templates')
        .where('sms_templates.id IS NOT NULL');

      if (user_id) {
        queryBuilder.andWhere('sms_templates.user_id = :user_id', { user_id });
      }

      if (search) {
        queryBuilder.andWhere(
          '(sms_templates.name ILIKE :search OR sms_templates.content ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      if (status) {
        queryBuilder.andWhere('sms_templates.status = :status', { status });
      }

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

  async update(
    updateData: UpdateSmsTemplateDto,
  ): Promise<SingleResponse<SmsTemplateEntity>> {
    try {
      await this.smsTemplateRepo.update(updateData.id, updateData);
      const updatedSmsTemplate: SmsTemplateEntity =
        await this.smsTemplateRepo.findOne({
          where: { id: updateData.id },
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
    const smsTemplate: SmsTemplateEntity = await this.smsTemplateRepo.findOne({
      where: { id },
    });

    if (!smsTemplate) {
      throw new HttpException(
        { message: 'SMS Template not found' },
        HttpStatus.NOT_FOUND,
      );
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
