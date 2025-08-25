import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EmailTemplateEntity } from '../entity/email-template.entity';
import {
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  EmailTemplateQueryDto,
} from '../utils/dto/email-template.dto';
import { EmailTemplateStatusEnum } from '../utils/enum/email-smtp.enum';
import { PaginationBuilder } from '../utils/pagination.builder';
import { MODELS } from '../constants/constants';
import { DEFAULT_EMAIL_TEMPLATES } from '../utils/email-templates/default-templates';
import { SingleResponse } from '../utils/dto/dto';
import { PaginationResponse } from '../utils/pagination.response';

@Injectable()
export class EmailTemplateService {
  constructor(
    @Inject(MODELS.EMAIL_TEMPLATE)
    private emailTemplateRepository: Repository<EmailTemplateEntity>,
  ) {}

  async create(
    userId: number,
    createEmailTemplateDto: CreateEmailTemplateDto,
  ): Promise<SingleResponse<EmailTemplateEntity>> {
    const template: EmailTemplateEntity = this.emailTemplateRepository.create({
      user_id: userId,
      name: createEmailTemplateDto.name,
      subject: createEmailTemplateDto.subject,
      html_content: createEmailTemplateDto.html_content,
      text_content: createEmailTemplateDto.text_content,
      variables: createEmailTemplateDto.variables || null,
      file_id: createEmailTemplateDto.file_id,
      description: createEmailTemplateDto.description,
      template_type: createEmailTemplateDto.template_type || 'html',
      status: EmailTemplateStatusEnum.ACTIVE,
    });

    const result: EmailTemplateEntity =
      await this.emailTemplateRepository.save(template);
    return { result: result };
  }

  async findAll(
    userId: number,
    query: EmailTemplateQueryDto,
  ): Promise<PaginationResponse<EmailTemplateEntity[]>> {
    const queryBuilder = this.emailTemplateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.file', 'file')
      .where('template.user_id = :userId', { userId });

    if (query.status) {
      queryBuilder.andWhere('template.status = :status', {
        status: query.status,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(template.name ILIKE :search OR template.subject ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    queryBuilder.orderBy('template.created_at', 'DESC');

    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .limit(query.limit)
      .offset((query.page - 1) * query.limit)
      .getMany();

    return PaginationBuilder.build(data, query.page, query.limit, total);
  }

  async findOne(userId: number, id: number): Promise<EmailTemplateEntity> {
    const template = await this.emailTemplateRepository.findOne({
      where: { id, user_id: userId },
      relations: ['file'],
    });

    if (!template) {
      throw new NotFoundException('Email template not found');
    }

    return template;
  }

  async update(
    userId: number,
    id: number,
    updateDto: UpdateEmailTemplateDto,
  ): Promise<SingleResponse<EmailTemplateEntity>> {
    const template: EmailTemplateEntity = await this.findOne(userId, id);
    Object.assign(template, updateDto);
    const result: EmailTemplateEntity =
      await this.emailTemplateRepository.save(template);
    return { result: result };
  }

  async remove(userId: number, id: number): Promise<void> {
    const template: EmailTemplateEntity = await this.findOne(userId, id);
    await this.emailTemplateRepository.remove(template);
  }

  async updateUsageStats(templateId: number): Promise<void> {
    const template = await this.emailTemplateRepository.findOne({
      where: { id: templateId },
    });

    if (template) {
      template.usage_count += 1;
      template.last_used_at = new Date();
      await this.emailTemplateRepository.save(template);
    }
  }

  async getActiveTemplates(userId: number): Promise<EmailTemplateEntity[]> {
    return this.emailTemplateRepository.find({
      where: {
        user_id: userId,
        status: EmailTemplateStatusEnum.ACTIVE,
      },
      relations: ['file'],
      order: { name: 'ASC' },
    });
  }

  async processTemplate(
    template: EmailTemplateEntity,
    variables: Record<string, any> = {},
  ): Promise<{ subject: string; html_content: string; text_content?: string }> {
    let processedSubject = template.subject;
    let processedHtml = template.html_content;
    let processedText = template.text_content;

    // Replace variables in template
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      processedSubject = processedSubject.replace(
        new RegExp(placeholder, 'g'),
        String(value),
      );
      processedHtml = processedHtml.replace(
        new RegExp(placeholder, 'g'),
        String(value),
      );
      if (processedText) {
        processedText = processedText.replace(
          new RegExp(placeholder, 'g'),
          String(value),
        );
      }
    }

    return {
      subject: processedSubject,
      html_content: processedHtml,
      text_content: processedText,
    };
  }

  async uploadTemplateImage(
    userId: number,
    file: Express.Multer.File,
  ): Promise<{ file_id: number; url: string }> {
    if (!file) {
      throw new NotFoundException('No file uploaded');
    }

    // Here you would typically:
    // 1. Save file to storage (local, S3, etc.)
    // 2. Create FileEntity record
    // 3. Return file info

    // For now, returning mock data
    return {
      file_id: 1, // This would be the actual file ID from FileEntity
      url: `/uploads/templates/${file.filename}`,
    };
  }

  async uploadTemplateImages(
    userId: number,
    files: Express.Multer.File[],
  ): Promise<{
    uploaded: number;
    files: Array<{ file_id: number; url: string }>;
  }> {
    const uploadedFiles = [];

    for (const file of files) {
      const result = await this.uploadTemplateImage(userId, file);
      uploadedFiles.push(result);
    }

    return {
      uploaded: uploadedFiles.length,
      files: uploadedFiles,
    };
  }

  async previewTemplate(id: number): Promise<string> {
    const template = await this.emailTemplateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Replace variables with sample data for preview
    let htmlContent = template.html_content;
    const variables = template.variables || {};

    for (const [key, defaultValue] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlContent = htmlContent.replace(regex, defaultValue as string);
    }

    return htmlContent;
  }

  async createFromDefault(
    userId: number,
    templateKey: string,
  ): Promise<SingleResponse<EmailTemplateEntity>> {
    const defaultTemplate = DEFAULT_EMAIL_TEMPLATES[templateKey];

    if (!defaultTemplate) {
      throw new NotFoundException('Default template not found');
    }

    const templateData: CreateEmailTemplateDto = {
      name: defaultTemplate.name,
      subject: defaultTemplate.subject,
      html_content: defaultTemplate.html_content,
      variables: defaultTemplate.variables,
      description: 'Default template',
      template_type: 'html',
    };

    const result = await this.create(userId, templateData);
    return { result: result.result };
  }

  async getDefaultTemplates(): Promise<any[]> {
    return Object.entries(DEFAULT_EMAIL_TEMPLATES).map(([key, template]) => ({
      key,
      name: template.name,
      description: 'Default template',
      category: 'html',
      preview: template.html_content.substring(0, 200) + '...',
    }));
  }

  async saveBuilderTemplate(
    userId: number,
    builderData: any,
  ): Promise<EmailTemplateEntity> {
    const template = this.emailTemplateRepository.create({
      user_id: userId,
      name: builderData.name || 'Builder Template',
      subject: builderData.subject || 'Template Subject',
      html_content: builderData.html_content || '',
      variables: builderData.variables || {},
      template_type: 'builder',
      builder_data: builderData.builder_data,
      styles: builderData.styles,
      status: EmailTemplateStatusEnum.ACTIVE,
    });

    return this.emailTemplateRepository.save(template);
  }

  async getBuilderTemplates(userId: number): Promise<EmailTemplateEntity[]> {
    return this.emailTemplateRepository.find({
      where: {
        user_id: userId,
        status: EmailTemplateStatusEnum.ACTIVE,
      },
      order: { created_at: 'DESC' },
    });
  }

  async getTemplateWithFile(
    userId: number,
    id: number,
  ): Promise<EmailTemplateEntity> {
    const template = await this.emailTemplateRepository.findOne({
      where: { id, user_id: userId },
      relations: ['file'],
    });

    if (!template) {
      throw new NotFoundException('Email template not found');
    }

    return template;
  }
}
