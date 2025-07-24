import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { MessageTemplatesEntity } from '../entity/message-templates.entity';
import { UserEntity } from '../entity/user.entity';
import { PaginationBuilder } from '../utils/pagination.builder';
import { PaginationResponse } from '../utils/pagination.response';
import { SingleResponse } from '../utils/dto/dto';

export interface CreateMessageTemplateDto {
  template_name: string;
  template_text: string;
  user_id: number;
}

export interface UpdateMessageTemplateDto {
  template_name?: string;
  template_text?: string;
  is_approved?: boolean;
}

export interface MessageTemplateFilters {
  is_approved?: boolean;
  user_id?: number;
  search?: string;
}

@Injectable()
export class MessageTemplatesService {
  private readonly logger = new Logger(MessageTemplatesService.name);

  constructor(
    @Inject(MODELS.MESSAGE_TEMPLATES)
    private readonly templateRepo: Repository<MessageTemplatesEntity>,
    @Inject(MODELS.USER)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async createTemplate(
    payload: CreateMessageTemplateDto,
  ): Promise<SingleResponse<MessageTemplatesEntity>> {
    try {
      const user = await this.userRepo.findOne({
        where: { id: payload.user_id },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (user.block) {
        throw new HttpException('User is blocked', HttpStatus.FORBIDDEN);
      }

      const existingTemplate: MessageTemplatesEntity =
        await this.templateRepo.findOne({
          where: {
            template_name: payload.template_name,
            user_id: payload.user_id,
          },
        });

      if (existingTemplate) {
        throw new HttpException(
          'Template with this name already exists',
          HttpStatus.CONFLICT,
        );
      }

      const newTemplate: MessageTemplatesEntity = this.templateRepo.create({
        ...payload,
        is_approved: false,
      });

      const result: MessageTemplatesEntity =
        await this.templateRepo.save(newTemplate);

      this.logger.log(`New message template created: ${result.id}`);
      return { result };
    } catch (error: any) {
      throw new HttpException(
        `Failed to create message template: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllTemplates(
    page: number = 1,
    limit: number = 10,
    filters?: MessageTemplateFilters,
  ): Promise<PaginationResponse<MessageTemplatesEntity[]>> {
    try {
      const query = this.templateRepo
        .createQueryBuilder('template')
        .leftJoinAndSelect('template.user', 'user');

      if (filters?.is_approved !== undefined) {
        query.andWhere('template.is_approved = :is_approved', {
          is_approved: filters.is_approved,
        });
      }

      if (filters?.user_id) {
        query.andWhere('template.user_id = :user_id', {
          user_id: filters.user_id,
        });
      }

      if (filters?.search) {
        query.andWhere(
          '(template.template_name ILIKE :search OR template.template_text ILIKE :search)',
          { search: `%${filters.search}%` },
        );
      }

      query.orderBy('template.created_at', 'DESC');

      const [templates, total] = await query
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return PaginationBuilder.build(templates, page, limit, total);
    } catch (error: any) {
      throw new HttpException(
        `Failed to get message templates: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTemplateById(
    id: number,
  ): Promise<SingleResponse<MessageTemplatesEntity>> {
    try {
      const template = await this.templateRepo.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!template) {
        throw new HttpException(
          'Message template not found',
          HttpStatus.NOT_FOUND,
        );
      }

      return { result: template };
    } catch (error: any) {
      throw new HttpException(
        `Failed to get message template: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserTemplates(
    userId: number,
    page: number = 1,
    limit: number = 10,
    is_approved?: boolean,
  ): Promise<PaginationResponse<MessageTemplatesEntity[]>> {
    try {
      const query = this.templateRepo
        .createQueryBuilder('template')
        .where('template.user_id = :userId', { userId });

      if (is_approved !== undefined) {
        query.andWhere('template.is_approved = :is_approved', { is_approved });
      }

      query.orderBy('template.created_at', 'DESC');

      const [templates, total] = await query
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return PaginationBuilder.build(templates, page, limit, total);
    } catch (error: any) {
      throw new HttpException(
        `Failed to get user templates: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateTemplate(
    id: number,
    payload: UpdateMessageTemplateDto,
  ): Promise<SingleResponse<MessageTemplatesEntity>> {
    try {
      const template = await this.templateRepo.findOne({ where: { id } });

      if (!template) {
        throw new HttpException(
          'Message template not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (payload.template_name) {
        const existingTemplate = await this.templateRepo.findOne({
          where: {
            template_name: payload.template_name,
            user_id: template.user_id,
          },
        });

        if (existingTemplate && existingTemplate.id !== id) {
          throw new HttpException(
            'Template with this name already exists',
            HttpStatus.CONFLICT,
          );
        }
      }

      Object.assign(template, payload);
      const result = await this.templateRepo.save(template);

      this.logger.log(`Message template updated: ${result.id}`);
      return { result };
    } catch (error: any) {
      throw new HttpException(
        `Failed to update message template: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteTemplate(
    id: number,
  ): Promise<SingleResponse<{ message: string }>> {
    try {
      const template = await this.templateRepo.findOne({ where: { id } });

      if (!template) {
        throw new HttpException(
          'Message template not found',
          HttpStatus.NOT_FOUND,
        );
      }

      await this.templateRepo.softDelete(id);

      this.logger.log(`Message template deleted: ${id}`);
      return { result: { message: 'Message template deleted successfully' } };
    } catch (error: any) {
      throw new HttpException(
        `Failed to delete message template: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async approveTemplate(
    id: number,
  ): Promise<SingleResponse<MessageTemplatesEntity>> {
    try {
      const template = await this.templateRepo.findOne({ where: { id } });

      if (!template) {
        throw new HttpException(
          'Message template not found',
          HttpStatus.NOT_FOUND,
        );
      }

      template.is_approved = !template.is_approved;
      const result = await this.templateRepo.save(template);

      this.logger.log(
        `Message template ${template.is_approved ? 'approved' : 'disapproved'}: ${id}`,
      );
      return { result };
    } catch (error: any) {
      throw new HttpException(
        `Failed to toggle template approval: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getApprovedTemplates(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginationResponse<MessageTemplatesEntity[]>> {
    try {
      const query = this.templateRepo
        .createQueryBuilder('template')
        .leftJoinAndSelect('template.user', 'user')
        .where('template.is_approved = :is_approved', { is_approved: true })
        .orderBy('template.created_at', 'DESC');

      const [templates, total] = await query
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return PaginationBuilder.build(templates, page, limit, total);
    } catch (error: any) {
      throw new HttpException(
        `Failed to get approved templates: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTemplateStatistics(userId?: number): Promise<
    SingleResponse<{
      total: number;
      approved: number;
      pending: number;
    }>
  > {
    try {
      const query = this.templateRepo.createQueryBuilder('template');

      if (userId) {
        query.where('template.user_id = :userId', { userId });
      }

      const total = await query.getCount();
      const approved = await query
        .andWhere('template.is_approved = :is_approved', { is_approved: true })
        .getCount();
      const pending = await query
        .andWhere('template.is_approved = :is_approved', { is_approved: false })
        .getCount();

      return {
        result: {
          total,
          approved,
          pending,
        },
      };
    } catch (error: any) {
      throw new HttpException(
        `Failed to get template statistics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
