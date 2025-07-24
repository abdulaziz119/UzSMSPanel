import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { SmsMessagesEntity } from '../entity/sms-messages.entity';
import { UserEntity } from '../entity/user.entity';
import { TariffEntity } from '../entity/tariffs.entity';
import { PaginationBuilder } from '../utils/pagination.builder';
import { PaginationResponse } from '../utils/pagination.response';
import { SingleResponse } from '../utils/dto/dto';
import {
  CreateSmsMessageDto,
  SmsMessageFilters,
  UpdateSmsMessageDto,
} from '../utils/interfaces/sms-messages.interface';

@Injectable()
export class SmsMessagesService {
  private readonly logger = new Logger(SmsMessagesService.name);

  constructor(
    @Inject(MODELS.SMS_MESSAGES)
    private readonly smsMessageRepo: Repository<SmsMessagesEntity>,
    @Inject(MODELS.USER)
    private readonly userRepo: Repository<UserEntity>,
    @Inject(MODELS.TARIFFS)
    private readonly tariffRepo: Repository<TariffEntity>,
  ) {}

  async createSmsMessage(
    payload: CreateSmsMessageDto,
  ): Promise<SingleResponse<SmsMessagesEntity>> {
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

      let tariffs: TariffEntity[] = [];
      if (payload.tariff_ids && payload.tariff_ids.length > 0) {
        tariffs = await this.tariffRepo.findByIds(payload.tariff_ids);
      }

      const newSmsMessage = this.smsMessageRepo.create({
        recipient_phone: payload.recipient_phone,
        message_text: payload.message_text,
        user_id: payload.user_id,
        status: 'pending',
        tariffs,
      });

      const result = await this.smsMessageRepo.save(newSmsMessage);

      this.logger.log(`New SMS message created: ${result.id}`);
      return { result };
    } catch (error: any) {
      throw new HttpException(
        `Failed to create SMS message: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllSmsMessages(
    page: number = 1,
    limit: number = 10,
    filters?: SmsMessageFilters,
  ): Promise<PaginationResponse<SmsMessagesEntity[]>> {
    try {
      const query = this.smsMessageRepo
        .createQueryBuilder('sms')
        .leftJoinAndSelect('sms.user', 'user')
        .leftJoinAndSelect('sms.tariffs', 'tariffs');

      if (filters?.status) {
        query.andWhere('sms.status = :status', { status: filters.status });
      }

      if (filters?.user_id) {
        query.andWhere('sms.user_id = :user_id', { user_id: filters.user_id });
      }

      if (filters?.recipient_phone) {
        query.andWhere('sms.recipient_phone ILIKE :phone', {
          phone: `%${filters.recipient_phone}%`,
        });
      }

      if (filters?.date_from) {
        query.andWhere('sms.created_at >= :date_from', {
          date_from: filters.date_from,
        });
      }

      if (filters?.date_to) {
        query.andWhere('sms.created_at <= :date_to', {
          date_to: filters.date_to,
        });
      }

      query.orderBy('sms.created_at', 'DESC');

      const [smsMessages, total] = await query
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return PaginationBuilder.build(smsMessages, page, limit, total);
    } catch (error: any) {
      throw new HttpException(
        `Failed to get SMS messages: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getSmsMessageById(
    id: number,
  ): Promise<SingleResponse<SmsMessagesEntity>> {
    try {
      const smsMessage = await this.smsMessageRepo.findOne({
        where: { id },
        relations: ['user', 'tariffs'],
      });

      if (!smsMessage) {
        throw new HttpException('SMS message not found', HttpStatus.NOT_FOUND);
      }

      return { result: smsMessage };
    } catch (error: any) {
      throw new HttpException(
        `Failed to get SMS message: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserSmsMessages(
    userId: number,
    page: number = 1,
    limit: number = 10,
    status?: 'pending' | 'sent' | 'failed',
  ): Promise<PaginationResponse<SmsMessagesEntity[]>> {
    try {
      const query = this.smsMessageRepo
        .createQueryBuilder('sms')
        .leftJoinAndSelect('sms.tariffs', 'tariffs')
        .where('sms.user_id = :userId', { userId });

      if (status) {
        query.andWhere('sms.status = :status', { status });
      }

      query.orderBy('sms.created_at', 'DESC');

      const [smsMessages, total] = await query
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return PaginationBuilder.build(smsMessages, page, limit, total);
    } catch (error: any) {
      throw new HttpException(
        `Failed to get user SMS messages: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateSmsMessage(
    id: number,
    payload: UpdateSmsMessageDto,
  ): Promise<SingleResponse<SmsMessagesEntity>> {
    try {
      const smsMessage: SmsMessagesEntity = await this.smsMessageRepo.findOne({
        where: { id },
      });

      if (!smsMessage) {
        throw new HttpException('SMS message not found', HttpStatus.NOT_FOUND);
      }

      Object.assign(smsMessage, payload);
      const result: SmsMessagesEntity =
        await this.smsMessageRepo.save(smsMessage);

      this.logger.log(`SMS message updated: ${result.id}`);
      return { result };
    } catch (error: any) {
      throw new HttpException(
        `Failed to update SMS message: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteSmsMessage(
    id: number,
  ): Promise<SingleResponse<{ message: string }>> {
    try {
      const smsMessage: SmsMessagesEntity = await this.smsMessageRepo.findOne({
        where: { id },
      });

      if (!smsMessage) {
        throw new HttpException('SMS message not found', HttpStatus.NOT_FOUND);
      }

      await this.smsMessageRepo.softDelete(id);

      this.logger.log(`SMS message deleted: ${id}`);
      return { result: { message: 'SMS message deleted successfully' } };
    } catch (error: any) {
      throw new HttpException(
        `Failed to delete SMS message: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendSmsMessage(id: number): Promise<SingleResponse<SmsMessagesEntity>> {
    try {
      const smsMessage: SmsMessagesEntity = await this.smsMessageRepo.findOne({
        where: { id },
        relations: ['user', 'tariffs'],
      });

      if (!smsMessage) {
        throw new HttpException('SMS message not found', HttpStatus.NOT_FOUND);
      }

      if (smsMessage.status !== 'pending') {
        throw new HttpException(
          'SMS message is not in pending status',
          HttpStatus.BAD_REQUEST,
        );
      }
      smsMessage.status = 'sent';
      smsMessage.sent_at = new Date();

      const result: SmsMessagesEntity =
        await this.smsMessageRepo.save(smsMessage);

      this.logger.log(`SMS message sent: ${result.id}`);
      return { result };
    } catch (error: any) {
      throw new HttpException(
        `Failed to send SMS message: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getSmsStatistics(userId?: number): Promise<
    SingleResponse<{
      total: number;
      pending: number;
      sent: number;
      failed: number;
    }>
  > {
    try {
      const query = this.smsMessageRepo.createQueryBuilder('sms');

      if (userId) {
        query.where('sms.user_id = :userId', { userId });
      }

      const total = await query.getCount();
      const pending = await query
        .andWhere('sms.status = :status', { status: 'pending' })
        .getCount();
      const sent = await query
        .andWhere('sms.status = :status', { status: 'sent' })
        .getCount();
      const failed = await query
        .andWhere('sms.status = :status', { status: 'failed' })
        .getCount();

      return {
        result: {
          total,
          pending,
          sent,
          failed,
        },
      };
    } catch (error: any) {
      throw new HttpException(
        `Failed to get SMS statistics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
