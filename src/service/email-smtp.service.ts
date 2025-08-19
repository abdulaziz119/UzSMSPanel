import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { EmailSmtpEntity } from '../entity/email-smtp.entity';
import {
  CreateEmailSmtpDto,
  UpdateEmailSmtpDto,
  EmailSmtpQueryDto,
} from '../utils/dto/email-smtp.dto';
import { SmtpStatusEnum } from '../utils/enum/email-smtp.enum';
import { PaginationBuilder } from '../utils/pagination.builder';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import { MODELS } from '../constants/constants';

@Injectable()
export class EmailSmtpService {
  constructor(
    @Inject(MODELS.EMAIL_SMTP)
    private emailSmtpRepository: Repository<EmailSmtpEntity>,
  ) {}

  async create(
    userId: number,
    createDto: CreateEmailSmtpDto,
  ): Promise<EmailSmtpEntity> {
    // Encrypt password
    const hashedPassword = crypto
      .createHash('sha256')
      .update(createDto.password)
      .digest('hex');

    const emailSmtp = this.emailSmtpRepository.create({
      ...createDto,
      password: hashedPassword,
      user_id: userId,
      status: SmtpStatusEnum.PENDING,
    });

    const savedSmtp = await this.emailSmtpRepository.save(emailSmtp);

    // Test SMTP connection
    try {
      await this.testConnection(savedSmtp.id);
      savedSmtp.status = SmtpStatusEnum.ACTIVE;
      await this.emailSmtpRepository.save(savedSmtp);
    } catch (error) {
      savedSmtp.status = SmtpStatusEnum.REJECTED;
      savedSmtp.rejection_reason = error.message;
      await this.emailSmtpRepository.save(savedSmtp);
      throw new BadRequestException(`SMTP connection failed: ${error.message}`);
    }

    return savedSmtp;
  }

  async findAll(userId: number, query: EmailSmtpQueryDto) {
    const queryBuilder = this.emailSmtpRepository
      .createQueryBuilder('smtp')
      .where('smtp.user_id = :userId', { userId });

    if (query.status) {
      queryBuilder.andWhere('smtp.status = :status', { status: query.status });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(smtp.name ILIKE :search OR smtp.host ILIKE :search OR smtp.from_email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .limit(query.limit)
      .offset((query.page - 1) * query.limit)
      .getMany();

    return PaginationBuilder.build(data, query.page, query.limit, total);
  }

  async findOne(userId: number, id: number): Promise<EmailSmtpEntity> {
    const smtp = await this.emailSmtpRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!smtp) {
      throw new NotFoundException('SMTP configuration not found');
    }

    return smtp;
  }

  async update(
    userId: number,
    id: number,
    updateDto: UpdateEmailSmtpDto,
  ): Promise<EmailSmtpEntity> {
    const smtp = await this.findOne(userId, id);

    if (updateDto.password) {
      updateDto.password = crypto
        .createHash('sha256')
        .update(updateDto.password)
        .digest('hex');
    }

    Object.assign(smtp, updateDto);

    // If connection details changed, test connection
    if (
      updateDto.host ||
      updateDto.port ||
      updateDto.username ||
      updateDto.password
    ) {
      try {
        await this.testConnectionWithData(smtp);
        smtp.status = SmtpStatusEnum.ACTIVE;
        smtp.rejection_reason = null;
      } catch (error) {
        smtp.status = SmtpStatusEnum.REJECTED;
        smtp.rejection_reason = error.message;
      }
    }

    return this.emailSmtpRepository.save(smtp);
  }

  async remove(userId: number, id: number): Promise<void> {
    const smtp = await this.findOne(userId, id);
    await this.emailSmtpRepository.remove(smtp);
  }

  async testConnection(smtpId: number): Promise<boolean> {
    const smtp = await this.emailSmtpRepository.findOne({
      where: { id: smtpId },
      select: ['host', 'port', 'username', 'password', 'use_ssl', 'use_tls'],
    });

    if (!smtp) {
      throw new NotFoundException('SMTP configuration not found');
    }

    return this.testConnectionWithData(smtp);
  }

  private async testConnectionWithData(
    smtp: EmailSmtpEntity,
  ): Promise<boolean> {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.use_ssl,
      auth: {
        user: smtp.username,
        pass: smtp.password,
      },
      tls: {
        rejectUnauthorized: smtp.use_tls,
      },
    });

    try {
      await transporter.verify();
      return true;
    } catch (error) {
      throw new Error(`SMTP verification failed: ${error.message}`);
    }
  }

  async getActiveSmtp(userId: number): Promise<EmailSmtpEntity> {
    const smtp = await this.emailSmtpRepository.findOne({
      where: {
        user_id: userId,
        status: SmtpStatusEnum.ACTIVE,
      },
      order: { last_used_at: 'ASC', created_at: 'ASC' },
    });

    if (!smtp) {
      throw new NotFoundException('No active SMTP configuration found');
    }

    return smtp;
  }

  async updateUsageStats(smtpId: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const smtp = await this.emailSmtpRepository.findOne({
      where: { id: smtpId },
    });

    if (!smtp) return;

    // Reset daily counter if it's a new day
    if (!smtp.last_reset_at || smtp.last_reset_at < today) {
      smtp.sent_today = 1;
      smtp.last_reset_at = today;
    } else {
      smtp.sent_today += 1;
    }

    smtp.last_used_at = new Date();
    await this.emailSmtpRepository.save(smtp);
  }
}
