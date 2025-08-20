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
    const emailSmtp = this.emailSmtpRepository.create({
      ...createDto,
      user_id: userId,
    });

    return this.emailSmtpRepository.save(emailSmtp);
  }

  async findAll(userId: number, query: EmailSmtpQueryDto) {
    const queryBuilder = this.emailSmtpRepository
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
    Object.assign(smtp, updateDto);
    return this.emailSmtpRepository.save(smtp);
  }

  async remove(userId: number, id: number): Promise<void> {
    const smtp = await this.findOne(userId, id);
    await this.emailSmtpRepository.remove(smtp);
  }

  async getActiveSmtp(userId: number): Promise<EmailSmtpEntity> {
    const smtp = await this.emailSmtpRepository
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
