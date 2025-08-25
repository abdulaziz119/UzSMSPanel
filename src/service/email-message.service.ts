import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { EmailMessageEntity } from '../entity/email-message.entity';
import {
  SendEmailDto,
  EmailMessageQueryDto,
} from '../utils/dto/email-message.dto';
import { EmailStatusEnum } from '../utils/enum/email-smtp.enum';
import { PaginationBuilder } from '../utils/pagination.builder';
import { EmailSmtpService } from './email-smtp.service';
import { EmailTemplateService } from './email-template.service';
import { EmailContactService } from './email-contact.service';
import { EmailGroupService } from './email-group.service';
import * as nodemailer from 'nodemailer';
import { MODELS } from '../constants/constants';

@Injectable()
export class EmailMessageService {
  constructor(
    @Inject(MODELS.EMAIL_MESSAGE)
    private emailMessageRepository: Repository<EmailMessageEntity>,
    private emailSmtpService: EmailSmtpService,
    private emailTemplateService: EmailTemplateService,
    private emailContactService: EmailContactService,
    private emailGroupService: EmailGroupService,
  ) {}

  async sendEmail(
    userId: number,
    sendDto: SendEmailDto,
  ): Promise<{ message: string; queued: number }> {
    let recipients: string[] = [];

    // Get recipients from group if specified
    if (sendDto.group_id) {
      const contacts = await this.emailContactService.getContactsByGroup(
        userId,
        sendDto.group_id,
      );
      recipients = contacts.map((contact) => contact.email);
    }

    // Add individual recipients if specified
    if (sendDto.recipient_emails && sendDto.recipient_emails.length > 0) {
      recipients = [...recipients, ...sendDto.recipient_emails];
    }

    // Remove duplicates
    recipients = [...new Set(recipients)];

    if (recipients.length === 0) {
      throw new BadRequestException('No recipients specified');
    }

    // Get email template (required)
    if (!sendDto.email_template_id) {
      throw new BadRequestException('email_template_id is required');
    }

    const template = await this.emailTemplateService.findOne(
      userId,
      sendDto.email_template_id,
    );

    if (!template) {
      throw new BadRequestException('Email template not found');
    }

    const emailContent = await this.emailTemplateService.processTemplate(template);
    await this.emailTemplateService.updateUsageStats(template.id);

    // Get SMTP configuration
    const smtp = sendDto.email_smtp_id
      ? await this.emailSmtpService.findOne(userId, sendDto.email_smtp_id)
      : await this.emailSmtpService.getActiveSmtp(userId);

    // Create email messages for each recipient
    const emailMessages: EmailMessageEntity[] = [];
    for (const recipientEmail of recipients) {
      const emailMessage = this.emailMessageRepository.create({
        user_id: userId,
        email_smtp_id: smtp.id,
        email_template_id: sendDto.email_template_id,
        group_id: sendDto.group_id,
        recipient_email: recipientEmail,
        status: EmailStatusEnum.PENDING,
      });

      emailMessages.push(emailMessage);
    }

    // Save all messages
    const savedMessages = await this.emailMessageRepository.save(emailMessages);

    // Process messages in background (for now, we'll process immediately)
    for (const message of savedMessages) {
      this.processEmailMessage(message, smtp, emailContent).catch((error) => {
        console.error(`Failed to send email ${message.id}:`, error);
      });
    }

    return {
      message: 'Emails queued for sending',
      queued: savedMessages.length,
    };
  }

  private async processEmailMessage(
    message: EmailMessageEntity,
    smtp: any,
    emailContent: { subject: string; html_content: string; text_content?: string },
  ): Promise<void> {
    try {
      // Create SMTP transporter
      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.use_ssl,
        auth: {
          user: smtp.username,
          pass: smtp.password, // Note: This should be decrypted in production
        },
        tls: {
          rejectUnauthorized: smtp.use_tls,
        },
      });

      // Send email
      const info = await transporter.sendMail({
        from: `${smtp.from_name || ''} <${smtp.from_email}>`,
        to: message.recipient_email,
        subject: emailContent.subject,
        html: emailContent.html_content,
        text: emailContent.text_content,
      });

      // Update message status
      message.status = EmailStatusEnum.SENT;
      await this.emailMessageRepository.save(message);
    } catch (error) {
      // Update message with error
      message.status = EmailStatusEnum.FAILED;
      message.error_message = error.message;
      await this.emailMessageRepository.save(message);

      console.error(`Failed to send email ${message.id}:`, error);
    }
  }

  async findAll(userId: number, query: EmailMessageQueryDto) {
    const queryBuilder = this.emailMessageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.emailSmtp', 'smtp')
      .leftJoinAndSelect('message.emailTemplate', 'template')
      .leftJoinAndSelect('message.emailGroup', 'group')
      .where('message.user_id = :userId', { userId });

    if (query.status) {
      queryBuilder.andWhere('message.status = :status', {
        status: query.status,
      });
    }

    if (query.group_id) {
      queryBuilder.andWhere('message.group_id = :groupId', {
        groupId: query.group_id,
      });
    }

    if (query.email_template_id) {
      queryBuilder.andWhere('message.email_template_id = :templateId', {
        templateId: query.email_template_id,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(message.recipient_email ILIKE :search OR message.subject ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.date_from) {
      queryBuilder.andWhere('message.created_at >= :dateFrom', {
        dateFrom: query.date_from,
      });
    }

    if (query.date_to) {
      queryBuilder.andWhere('message.created_at <= :dateTo', {
        dateTo: query.date_to,
      });
    }

    queryBuilder.orderBy('message.created_at', 'DESC');

    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .limit(query.limit)
      .offset((query.page - 1) * query.limit)
      .getMany();

    return PaginationBuilder.build(data, query.page, query.limit, total);
  }

  async findOne(userId: number, id: number): Promise<EmailMessageEntity> {
    const message = await this.emailMessageRepository.findOne({
      where: { id, user_id: userId },
      relations: ['emailSmtp', 'emailTemplate', 'emailGroup'],
    });

    if (!message) {
      throw new NotFoundException('Email message not found');
    }

    return message;
  }

  async retryFailedEmail(
    userId: number,
    id: number,
  ): Promise<EmailMessageEntity> {
    const message = await this.findOne(userId, id);

    if (message.status !== EmailStatusEnum.FAILED) {
      throw new BadRequestException('Only failed emails can be retried');
    }

    message.status = EmailStatusEnum.PENDING;
    message.error_message = null;
    const savedMessage = await this.emailMessageRepository.save(message);

    // Get template content for retry
    const template = await this.emailTemplateService.findOne(
      userId,
      message.email_template_id,
    );
    const emailContent = await this.emailTemplateService.processTemplate(template);

    // Retry sending
    const smtp = await this.emailSmtpService.findOne(
      userId,
      message.email_smtp_id,
    );
    this.processEmailMessage(savedMessage, smtp, emailContent).catch((error) => {
      console.error(`Failed to retry email ${message.id}:`, error);
    });

    return savedMessage;
  }

  async getEmailStats(userId: number): Promise<any> {
    const stats = await this.emailMessageRepository
      .createQueryBuilder('message')
      .select(['message.status', 'COUNT(*) as count'])
      .where('message.user_id = :userId', { userId })
      .groupBy('message.status')
      .getRawMany();

    return stats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.count);
      return acc;
    }, {});
  }

  async findAllForAdmin(query: EmailMessageQueryDto) {
    const queryBuilder = this.emailMessageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.emailSmtp', 'smtp')
      .leftJoinAndSelect('message.emailTemplate', 'template')
      .leftJoinAndSelect('message.emailGroup', 'group');

    if (query.status) {
      queryBuilder.andWhere('message.status = :status', {
        status: query.status,
      });
    }

    if (query.group_id) {
      queryBuilder.andWhere('message.group_id = :groupId', {
        groupId: query.group_id,
      });
    }

    if (query.email_template_id) {
      queryBuilder.andWhere('message.email_template_id = :templateId', {
        templateId: query.email_template_id,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(message.recipient_email ILIKE :search OR message.subject ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.date_from) {
      queryBuilder.andWhere('message.created_at >= :dateFrom', {
        dateFrom: query.date_from,
      });
    }

    if (query.date_to) {
      queryBuilder.andWhere('message.created_at <= :dateTo', {
        dateTo: query.date_to,
      });
    }

    queryBuilder.orderBy('message.created_at', 'DESC');

    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .limit(query.limit)
      .offset((query.page - 1) * query.limit)
      .getMany();

    return PaginationBuilder.build(data, query.page, query.limit, total);
  }

  async getGlobalEmailStats(): Promise<any> {
    const stats = await this.emailMessageRepository
      .createQueryBuilder('message')
      .select(['message.status', 'COUNT(*) as count'])
      .groupBy('message.status')
      .getRawMany();

    return stats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.count);
      return acc;
    }, {});
  }

  async findOneForAdmin(id: number): Promise<EmailMessageEntity> {
    const message = await this.emailMessageRepository.findOne({
      where: { id },
      relations: ['emailSmtp', 'emailTemplate', 'emailGroup'],
    });

    if (!message) {
      throw new NotFoundException('Email message not found');
    }

    return message;
  }

  async retryFailedEmailForAdmin(id: number): Promise<EmailMessageEntity> {
    const message = await this.findOneForAdmin(id);

    if (message.status !== EmailStatusEnum.FAILED) {
      throw new BadRequestException('Only failed emails can be retried');
    }

    message.status = EmailStatusEnum.PENDING;
    message.error_message = null;
    const savedMessage = await this.emailMessageRepository.save(message);

    // Get template content for retry
    const template = await this.emailTemplateService.findOne(
      message.user_id,
      message.email_template_id,
    );
    const emailContent = await this.emailTemplateService.processTemplate(template);

    // Retry sending
    const smtp = await this.emailSmtpService.findOne(
      message.user_id,
      message.email_smtp_id,
    );
    this.processEmailMessage(savedMessage, smtp, emailContent).catch((error) => {
      console.error(`Failed to retry email ${message.id}:`, error);
    });

    return savedMessage;
  }

  async bulkRetryFailedEmails(messageIds: number[]): Promise<{ retried: number }> {
    let retriedCount = 0;

    for (const messageId of messageIds) {
      try {
        await this.retryFailedEmailForAdmin(messageId);
        retriedCount++;
      } catch (error) {
        console.error(`Failed to retry email ${messageId}:`, error);
      }
    }

    return { retried: retriedCount };
  }

  async deleteEmailMessage(id: number): Promise<{ deleted: boolean }> {
    const result = await this.emailMessageRepository.delete(id);
    return { deleted: result.affected > 0 };
  }
}
