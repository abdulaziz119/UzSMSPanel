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
import { PaginationBuilder } from '../utils/pagination.builder';
import { MODELS } from '../constants/constants';
import { SingleResponse } from '../utils/dto/dto';
import { PaginationResponse } from '../utils/pagination.response';

@Injectable()
export class EmailSmtpService {
  constructor(
    @Inject(MODELS.EMAIL_SMTP)
    private readonly emailSmtpRepo: Repository<EmailSmtpEntity>,
  ) {}

  async create(
    userId: number,
    createDto: CreateEmailSmtpDto,
  ): Promise<SingleResponse<EmailSmtpEntity>> {
    const emailData: EmailSmtpEntity = await this.emailSmtpRepo.findOne({
      where: { user_id: userId },
    });
    if (emailData) {
      throw new BadRequestException('SMTP configuration already exists');
    }
    const emailSmtp: EmailSmtpEntity = this.emailSmtpRepo.create({
      ...createDto,
      user_id: userId,
    });

    const result: EmailSmtpEntity = await this.emailSmtpRepo.save(emailSmtp);
    return { result: result };
  }

  async findAll(
    userId: number,
    query: EmailSmtpQueryDto,
  ): Promise<PaginationResponse<EmailSmtpEntity[]>> {
    const queryBuilder = this.emailSmtpRepo
      .createQueryBuilder('smtp')
      .where('smtp.user_id = :userId', { userId });

    if (query.search) {
      queryBuilder.andWhere(
        '(smtp.host ILIKE :search OR smtp.from_email ILIKE :search OR smtp.username ILIKE :search)',
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
    const smtp = await this.emailSmtpRepo.findOne({
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
  ): Promise<SingleResponse<EmailSmtpEntity>> {
    const smtp: EmailSmtpEntity = await this.findOne(userId, id);
    Object.assign(smtp, updateDto);
    const result: EmailSmtpEntity = await this.emailSmtpRepo.save(smtp);
    return { result: result };
  }

  async remove(userId: number, id: number): Promise<void> {
    const smtp: EmailSmtpEntity = await this.findOne(userId, id);
    await this.emailSmtpRepo.remove(smtp);
  }

  async getActiveSmtp(userId: number): Promise<EmailSmtpEntity> {
    const smtp = await this.emailSmtpRepo
      .createQueryBuilder('smtp')
      .addSelect('smtp.password')
      .where('smtp.user_id = :userId', { userId })
      .orderBy('smtp.created_at', 'ASC')
      .getOne();

    if (!smtp) {
      throw new NotFoundException('No active SMTP configuration found');
    }

    return smtp;
  }
}
