import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { SmsMessageEntity } from '../entity/sms-message.entity';
import { UserEntity } from '../entity/user.entity';
import { PaginationResponse } from '../utils/pagination.response';
import { getPaginationResponse } from '../utils/pagination.builder';
import {
  MessageStatusEnum,
  MessageTypeEnum,
} from '../utils/enum/sms-message.enum';
import { SmsHistoryFilterDto } from '../utils/dto/sms-message.dto';
import { SmsTemplateEntity } from '../entity/sms-template.entity';
import { ContactStatusEnum, ContactTypeEnum } from '../utils/enum/contact.enum';
import { BillingService } from './billing.service';
import { PerformanceMonitor } from '../utils/performance-monitor.util';
import { ContactEntity } from '../entity/contact.entity';
import { TransactionEntity } from '../entity/transaction.entity';
import {
  TransactionStatusEnum,
  TransactionTypeEnum,
} from '../utils/enum/transaction.enum';

@Injectable()
export class SmsMessageService {
  constructor(
    @Inject(MODELS.SMS_MESSAGE)
    private readonly messageRepo: Repository<SmsMessageEntity>,
    private readonly billingService: BillingService,
    private readonly performanceMonitor: PerformanceMonitor,
  ) {}

  // Create a single SMS message with billing in transaction
  async createSmsMessageWithBilling(
    smsData: {
      user_id: number;
      phone: string;
      message: string;
      operator: string;
      sms_template_id: number;
      cost: number;
      price_provider_sms: number;
    },
    template: SmsTemplateEntity,
    balance?: ContactTypeEnum,
    totalCost?: number,
  ): Promise<SmsMessageEntity> {
    return await this.messageRepo.manager.transaction(async (em) => {
      // Capture balance_before
      let balanceBefore: number = 0;
      if (balance) {
        const row = await em
          .getRepository(ContactEntity)
          .createQueryBuilder('c')
          .select('COALESCE(SUM(c.balance), 0)', 'sum')
          .where('c.user_id = :user_id', { user_id: smsData.user_id })
          .andWhere('c.type = :type', { type: balance })
          .andWhere('c.status = :status', { status: ContactStatusEnum.ACTIVE })
          .getRawOne<{ sum: string }>();
        balanceBefore = Number(row?.sum || 0);
      } else {
        const user: UserEntity = await em.getRepository(UserEntity).findOne({
          where: { id: smsData.user_id },
          select: ['balance'],
        });
        balanceBefore = Number(user?.balance || 0);
      }

      // Deduct from contact balance when header is provided, otherwise from user balance
      if (balance) {
        await this.billingService.deductContactBalanceTransactional(
          em,
          smsData.user_id,
          balance,
          totalCost,
        );
      } else {
        await this.billingService.deductBalanceTransactional(
          em,
          smsData.user_id,
          totalCost,
        );
      }

      // Create SMS message
      const msg: SmsMessageEntity = em.getRepository(SmsMessageEntity).create({
        user_id: smsData.user_id,
        phone: smsData.phone,
        message: smsData.message,
        status: MessageStatusEnum.SENT,
        message_type: MessageTypeEnum.SMS,
        operator: smsData.operator,
        sms_template_id: smsData.sms_template_id,
        cost: smsData.cost,
        price_provider_sms: smsData.price_provider_sms,
      });
      const saved: SmsMessageEntity = await em
        .getRepository(SmsMessageEntity)
        .save(msg);

      // Update template usage
      await em.getRepository(SmsTemplateEntity).update(
        { id: template.id },
        {
          usage_count: (): string => 'usage_count + 1',
          last_used_at: saved.created_at,
        },
      );

      // Create Transaction record linked to this single message
      const amount: number = Number(totalCost || smsData.cost || 0);
      const balanceAfter: number = Math.max(0, balanceBefore - amount);
      const trx: TransactionEntity = em
        .getRepository(TransactionEntity)
        .create({
          user_id: smsData.user_id,
          transaction_id: this.generateExternalTransactionId(),
          type: TransactionTypeEnum.SMS_PAYMENT,
          status: TransactionStatusEnum.COMPLETED,
          amount: -Math.abs(amount),
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          description: `Single SMS send to ${smsData.phone}`,
          sms_message_id: saved.id,
          group_id: null,
        });
      await em.getRepository(TransactionEntity).save(trx);

      return saved;
    });
  }

  // Create bulk SMS messages with billing in transaction (optimized)
  async createBulkSmsMessagesWithBilling(
    smsDataArray: Array<{
      user_id: number;
      phone: string;
      message: string;
      operator: string;
      sms_template_id: number;
      cost: number;
      price_provider_sms: number;
      group_id: number;
    }>,
    template: SmsTemplateEntity,
    balance?: ContactTypeEnum,
    totalCost?: number,
  ): Promise<SmsMessageEntity[]> {
    return await this.performanceMonitor.measureAsync(
      'createBulkSmsMessagesWithBilling',
      async () => {
        return await this.messageRepo.manager.transaction(async (em) => {
          // Capture balance_before
          const user_id: number = smsDataArray[0].user_id;
          let balanceBefore: number = 0;
          if (balance) {
            const row = await em
              .getRepository(ContactEntity)
              .createQueryBuilder('c')
              .select('COALESCE(SUM(c.balance), 0)', 'sum')
              .where('c.user_id = :user_id', { user_id })
              .andWhere('c.type = :type', { type: balance })
              .andWhere('c.status = :status', {
                status: ContactStatusEnum.ACTIVE,
              })
              .getRawOne<{ sum: string }>();
            balanceBefore = Number(row?.sum || 0);
          } else {
            const user: UserEntity = await em
              .getRepository(UserEntity)
              .findOne({
                where: { id: user_id },
                select: ['balance'],
              });
            balanceBefore = Number(user?.balance || 0);
          }

          // Deduct total from contact or user balance
          const billingTimer =
            this.performanceMonitor.startTimer('billing_deduction');
          if (balance) {
            await this.billingService.deductContactBalanceTransactional(
              em,
              user_id,
              balance,
              totalCost,
            );
          } else {
            await this.billingService.deductBalanceTransactional(
              em,
              user_id,
              totalCost,
            );
          }
          billingTimer();

          // Optimized bulk insert
          const insertTimer = this.performanceMonitor.startTimer('bulk_insert');
          const repo = em.getRepository(SmsMessageEntity);

          // Create entities in batches to avoid memory issues
          const CHUNK_SIZE = 1000;
          const savedMessages: SmsMessageEntity[] = [];

          for (let i: number = 0; i < smsDataArray.length; i += CHUNK_SIZE) {
            const chunk = smsDataArray.slice(i, i + CHUNK_SIZE);
            const toSave: SmsMessageEntity[] = chunk.map((smsData) =>
              repo.create({
                user_id: smsData.user_id,
                phone: smsData.phone,
                message: smsData.message,
                status: MessageStatusEnum.SENT,
                message_type: MessageTypeEnum.SMS,
                operator: smsData.operator,
                sms_template_id: smsData.sms_template_id,
                cost: smsData.cost,
                price_provider_sms: smsData.price_provider_sms,
                group_id: smsData.group_id,
              }),
            );

            const chunkSaved: SmsMessageEntity[] = await repo.save(toSave, {
              chunk: 500,
            });
            savedMessages.push(...chunkSaved);
          }
          insertTimer();

          // Update template usage with single query
          const templateTimer =
            this.performanceMonitor.startTimer('template_update');
          await em.getRepository(SmsTemplateEntity).update(
            { id: template.id },
            {
              usage_count: (): string =>
                `usage_count + ${savedMessages.length}`,
              last_used_at: new Date(),
            },
          );
          templateTimer();

          // Create single aggregated Transaction for the group
          const amount: number = Number(totalCost || 0);
          const balanceAfter: number = Math.max(0, balanceBefore - amount);
          const group_id: number = smsDataArray[0]?.group_id ?? null;
          const trx: TransactionEntity = em
            .getRepository(TransactionEntity)
            .create({
              user_id,
              transaction_id: this.generateExternalTransactionId(),
              type: TransactionTypeEnum.SMS_PAYMENT,
              status: TransactionStatusEnum.COMPLETED,
              amount: -Math.abs(amount),
              balance_before: balanceBefore,
              balance_after: balanceAfter,
              description: `Group SMS send (group_id=${group_id}) x${savedMessages.length}`,
              group_id,
              sms_message_id: null,
            });
          await em.getRepository(TransactionEntity).save(trx);

          return savedMessages;
        });
      },
    );
  }

  async getHistory(
    filters: SmsHistoryFilterDto,
    user_id: number,
    isDashboard: boolean,
  ): Promise<PaginationResponse<SmsMessageEntity[]>> {
    const { page = 1, limit = 20 } = filters;
    const skip: number = (page - 1) * limit;

    try {
      const queryBuilder = this.messageRepo
        .createQueryBuilder('message')
        .where('message.user_id = :user_id', { user_id })
        .orderBy('message.created_at', 'DESC');

      // By default select all columns; if not dashboard, omit provider price from results
      if (isDashboard === false) {
        queryBuilder.select([
          'message.id',
          'message.user_id',
          'message.group_id',
          'message.phone',
          'message.message',
          'message.sms_template_id',
          'message.status',
          'message.message_type',
          'message.operator',
          'message.cost',
          // omit message.price_provider_sms intentionally
          'message.error_message',
          'message.delivery_report',
          'message.created_at',
          'message.updated_at',
        ]);
      }

      // Filtrlarni qo'llash
      if (filters.date_from) {
        queryBuilder.andWhere('message.created_at >= :date_from', {
          date_from: filters.date_from,
        });
      }

      if (filters.date_to) {
        queryBuilder.andWhere('message.created_at <= :date_to', {
          date_to: filters.date_to,
        });
      }

      if (filters.status) {
        queryBuilder.andWhere('message.status = :status', {
          status: filters.status,
        });
      }

      if (filters.phone) {
        queryBuilder.andWhere('message.phone LIKE :phone', {
          phone: `%${filters.phone}%`,
        });
      }

      if (filters.sender) {
        queryBuilder.andWhere('message.sender = :sender', {
          sender: filters.sender,
        });
      }

      const [messages, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return getPaginationResponse<SmsMessageEntity>(
        messages,
        page,
        limit,
        total,
      );
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching SMS history', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // async getStatistics(user_id: number): Promise<SingleResponse<any>> {
  //   try {
  //     const totalSent = await this.messageRepo.count({
  //       where: { user_id },
  //     });
  //
  //     const delivered = await this.messageRepo.count({
  //       where: { user_id, status: MessageStatusEnum.DELIVERED },
  //     });
  //
  //     const failed = await this.messageRepo.count({
  //       where: { user_id, status: MessageStatusEnum.FAILED },
  //     });
  //
  //     const pending = await this.messageRepo.count({
  //       where: { user_id, status: MessageStatusEnum.PENDING },
  //     });
  //
  //     // Umumiy xarajat
  //     const result = await this.messageRepo
  //       .createQueryBuilder('message')
  //       .select('SUM(message.cost)', 'total_cost')
  //       .where('message.user_id = :user_id', { user_id })
  //       .getRawOne();
  //
  //     const statistics = {
  //       total_sent: totalSent,
  //       delivered,
  //       failed,
  //       pending,
  //       total_cost: parseFloat(result.total_cost) || 0,
  //       delivery_rate: totalSent > 0 ? (delivered / totalSent) * 100 : 0,
  //       success_rate:
  //         totalSent > 0 ? ((delivered / totalSent) * 100).toFixed(2) : '0',
  //     };
  //
  //     return { result: statistics };
  //   } catch (error) {
  //     throw new HttpException(
  //       { message: 'Error fetching SMS statistics', error: error.message },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
  //
  // async updateMessageStatus(
  //   message_id: string,
  //   status: MessageStatusEnum,
  //   delivery_report?: any,
  // ): Promise<void> {
  //   try {
  //     const updateData: any = { status };
  //
  //     if (status === MessageStatusEnum.SENT) {
  //       updateData.sent_at = new Date();
  //     } else if (status === MessageStatusEnum.DELIVERED) {
  //       updateData.delivered_at = new Date();
  //     }
  //
  //     if (delivery_report) {
  //       updateData.delivery_report = delivery_report;
  //     }
  //
  //     await this.messageRepo.update({ message_id }, updateData);
  //   } catch (error) {
  //     throw new HttpException(
  //       { message: 'Error updating message status', error: error.message },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  // private calculateSmsPrice(
  //   phone: string,
  //   messageType?: MessageTypeEnum,
  // ): number {
  //   // SMS narxini operator va tip bo'yicha hisoblash
  //   const operator = this.detectOperator(phone);
  //
  //   // Soddalashtirilgan narx tizimi
  //   const basePrices = {
  //     [OperatorEnum.BEELINE]: 100,
  //     [OperatorEnum.UCELL]: 105,
  //     [OperatorEnum.UMS]: 110,
  //     [OperatorEnum.PERFECTUM]: 115,
  //     [OperatorEnum.HUMANS]: 120,
  //   };
  //
  //   return basePrices[operator] || 100; // Default narx
  // }
  //
  // private detectOperator(phone: string): OperatorEnum {
  //   // Telefon raqam bo'yicha operatorni aniqlash
  //   const phoneNumber = phone.replace(/\D/g, ''); // Faqat raqamlar
  //
  //   if (phoneNumber.startsWith('99890') || phoneNumber.startsWith('99891')) {
  //     return OperatorEnum.BEELINE;
  //   } else if (
  //     phoneNumber.startsWith('99893') ||
  //     phoneNumber.startsWith('99894')
  //   ) {
  //     return OperatorEnum.UCELL;
  //   } else if (
  //     phoneNumber.startsWith('99895') ||
  //     phoneNumber.startsWith('99896')
  //   ) {
  //     return OperatorEnum.UMS;
  //   } else if (
  //     phoneNumber.startsWith('99897') ||
  //     phoneNumber.startsWith('99898')
  //   ) {
  //     return OperatorEnum.PERFECTUM;
  //   } else if (phoneNumber.startsWith('99899')) {
  //     return OperatorEnum.HUMANS;
  //   }
  //
  //   return OperatorEnum.BEELINE; // Default
  // }
  //
  // private generateMessageId(): string {
  //   return `MSG_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  // }
  //
  // private generateBatchId(): string {
  //   return `BATCH_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  // }

  // Dashboard-specific methods
  private generateExternalTransactionId(): string {
    return `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }
  // async getMessageHistory(
  //   filters: MessageFilterDto,
  // ): Promise<PaginationResponse<SmsMessageEntity[]>> {
  //   try {
  //     const queryBuilder = this.messageRepo
  //       .createQueryBuilder('message')
  //       .leftJoinAndSelect('message.user', 'user');
  //
  //     // Apply filters
  //     if (filters.status) {
  //       queryBuilder.andWhere('message.status = :status', {
  //         status: filters.status,
  //       });
  //     }
  //
  //     if (filters.phone) {
  //       queryBuilder.andWhere('message.phone ILIKE :phone', {
  //         phone: `%${filters.phone}%`,
  //       });
  //     }
  //
  //     if (filters.sender) {
  //       queryBuilder.andWhere('message.sender ILIKE :sender', {
  //         sender: `%${filters.sender}%`,
  //       });
  //     }
  //
  //     if (filters.user_id) {
  //       queryBuilder.andWhere('message.user_id = :user_id', {
  //         user_id: filters.user_id,
  //       });
  //     }
  //
  //     if (filters.operator) {
  //       queryBuilder.andWhere('message.operator = :operator', {
  //         operator: filters.operator,
  //       });
  //     }
  //
  //     if (filters.direction) {
  //       queryBuilder.andWhere('message.direction = :direction', {
  //         direction: filters.direction,
  //       });
  //     }
  //
  //     if (filters.date_from) {
  //       queryBuilder.andWhere('message.created_at >= :date_from', {
  //         date_from: filters.date_from,
  //       });
  //     }
  //
  //     if (filters.date_to) {
  //       queryBuilder.andWhere('message.created_at <= :date_to', {
  //         date_to: filters.date_to,
  //       });
  //     }
  //
  //     if (filters.search) {
  //       queryBuilder.andWhere(
  //         '(message.message ILIKE :search OR message.phone ILIKE :search)',
  //         { search: `%${filters.search}%` },
  //       );
  //     }
  //
  //     queryBuilder.orderBy('message.created_at', 'DESC');
  //
  //     const total = await queryBuilder.getCount();
  //
  //     if (filters.page && filters.limit) {
  //       queryBuilder
  //         .skip((filters.page - 1) * filters.limit)
  //         .take(filters.limit);
  //     }
  //
  //     const messages = await queryBuilder.getMany();
  //
  //     return getPaginationResponse(
  //       messages,
  //       total,
  //       filters.page || 1,
  //       filters.limit || 10,
  //     );
  //   } catch (error) {
  //     throw new HttpException(
  //       { message: 'Error fetching message history', error: error.message },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
  //
  // async getMessageDetails(
  //   id: number,
  // ): Promise<SingleResponse<SmsMessageEntity>> {
  //   try {
  //     const message = await this.messageRepo.findOne({
  //       where: { id },
  //       relations: ['user'],
  //     });
  //
  //     if (!message) {
  //       throw new NotFoundException('Message not found');
  //     }
  //
  //     return { result: message };
  //   } catch (error) {
  //     if (error instanceof NotFoundException) {
  //       throw error;
  //     }
  //     throw new HttpException(
  //       { message: 'Error fetching message details', error: error.message },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  //
  // async getMessageStatistics(
  //   filters: MessageStatsDto,
  // ): Promise<SingleResponse<any>> {
  //   try {
  //     const queryBuilder = this.messageRepo.createQueryBuilder('message');
  //
  //     if (filters.date_from) {
  //       queryBuilder.andWhere('message.created_at >= :date_from', {
  //         date_from: filters.date_from,
  //       });
  //     }
  //
  //     if (filters.date_to) {
  //       queryBuilder.andWhere('message.created_at <= :date_to', {
  //         date_to: filters.date_to,
  //       });
  //     }
  //
  //     if (filters.user_id) {
  //       queryBuilder.andWhere('message.user_id = :user_id', {
  //         user_id: filters.user_id,
  //       });
  //     }
  //
  //     if (filters.operator) {
  //       queryBuilder.andWhere('message.operator = :operator', {
  //         operator: filters.operator,
  //       });
  //     }
  //
  //     const statistics = await queryBuilder
  //       .select([
  //         'COUNT(*) as total_messages',
  //         'SUM(CASE WHEN status = :sent THEN 1 ELSE 0 END) as sent_count',
  //         'SUM(CASE WHEN status = :delivered THEN 1 ELSE 0 END) as delivered_count',
  //         'SUM(CASE WHEN status = :failed THEN 1 ELSE 0 END) as failed_count',
  //         'SUM(CASE WHEN status = :pending THEN 1 ELSE 0 END) as pending_count',
  //         'SUM(cost) as total_cost',
  //         'SUM(parts_count) as total_parts',
  //         'AVG(cost) as average_cost',
  //         'ROUND(AVG(CASE WHEN delivered_at IS NOT NULL AND sent_at IS NOT NULL THEN EXTRACT(EPOCH FROM (delivered_at - sent_at)) ELSE NULL END), 2) as avg_delivery_time',
  //       ])
  //       .setParameters({
  //         sent: MessageStatusEnum.SENT,
  //         delivered: MessageStatusEnum.DELIVERED,
  //         failed: MessageStatusEnum.FAILED,
  //         pending: MessageStatusEnum.PENDING,
  //       })
  //       .getRawOne();
  //
  //     // Calculate delivery rate
  //     const delivered = parseInt(statistics.delivered_count) || 0;
  //     const total = parseInt(statistics.total_messages) || 0;
  //     const delivery_rate = total > 0 ? (delivered / total) * 100 : 0;
  //
  //     const result = {
  //       ...statistics,
  //       delivery_rate: parseFloat(delivery_rate.toFixed(2)),
  //       success_rate: parseFloat(delivery_rate.toFixed(2)),
  //     };
  //
  //     return { result };
  //   } catch (error) {
  //     throw new HttpException(
  //       { message: 'Error fetching message statistics', error: error.message },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
  //
  // async resendMessage(
  //   id: number,
  // ): Promise<SingleResponse<{ message: string }>> {
  //   try {
  //     const message = await this.messageRepo.findOne({ where: { id } });
  //
  //     if (!message) {
  //       throw new NotFoundException('Message not found');
  //     }
  //
  //     if (message.status === MessageStatusEnum.DELIVERED) {
  //       throw new BadRequestException('Cannot resend delivered message');
  //     }
  //
  //     // Reset message status and resend
  //     await this.messageRepo.update(id, {
  //       status: MessageStatusEnum.PENDING,
  //       sent_at: null,
  //       delivered_at: null,
  //       updated_at: new Date(),
  //     });
  //
  //     // Trigger resend
  //     const updatedMessage = await this.messageRepo.findOne({ where: { id } });
  //     await this.sendSmsToProvider(updatedMessage);
  //
  //     return { result: { message: 'Message resent successfully' } };
  //   } catch (error) {
  //     if (
  //       error instanceof NotFoundException ||
  //       error instanceof BadRequestException
  //     ) {
  //       throw error;
  //     }
  //     throw new HttpException(
  //       { message: 'Error resending message', error: error.message },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
  //
  // async bulkResend(
  //   message_ids: number[],
  // ): Promise<SingleResponse<{ message: string; resent_count: number }>> {
  //   try {
  //     let resent_count = 0;
  //
  //     for (const id of message_ids) {
  //       try {
  //         await this.resendMessage(id);
  //         resent_count++;
  //       } catch (error) {
  //         // Continue with other messages if one fails
  //         console.error(`Failed to resend message ${id}:`, error.message);
  //       }
  //     }
  //
  //     return {
  //       result: {
  //         message: 'Bulk resend completed',
  //         resent_count,
  //       },
  //     };
  //   } catch (error) {
  //     throw new HttpException(
  //       { message: 'Error performing bulk resend', error: error.message },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
  //
  // async getOperatorStatistics(
  //   filters: MessageStatsDto,
  // ): Promise<SingleResponse<any>> {
  //   try {
  //     const queryBuilder = this.messageRepo.createQueryBuilder('message');
  //
  //     if (filters.date_from) {
  //       queryBuilder.andWhere('message.created_at >= :date_from', {
  //         date_from: filters.date_from,
  //       });
  //     }
  //
  //     if (filters.date_to) {
  //       queryBuilder.andWhere('message.created_at <= :date_to', {
  //         date_to: filters.date_to,
  //       });
  //     }
  //
  //     if (filters.user_id) {
  //       queryBuilder.andWhere('message.user_id = :user_id', {
  //         user_id: filters.user_id,
  //       });
  //     }
  //
  //     const operatorStats = await queryBuilder
  //       .select([
  //         'message.operator as operator',
  //         'COUNT(*) as total_messages',
  //         'SUM(CASE WHEN status = :delivered THEN 1 ELSE 0 END) as delivered_count',
  //         'SUM(CASE WHEN status = :failed THEN 1 ELSE 0 END) as failed_count',
  //         'SUM(cost) as total_cost',
  //         'AVG(cost) as average_cost',
  //       ])
  //       .setParameters({
  //         delivered: MessageStatusEnum.DELIVERED,
  //         failed: MessageStatusEnum.FAILED,
  //       })
  //       .groupBy('message.operator')
  //       .getRawMany();
  //
  //     // Calculate delivery rates for each operator
  //     const result = operatorStats.map((stat) => ({
  //       ...stat,
  //       delivery_rate:
  //         stat.total_messages > 0
  //           ? parseFloat(
  //               ((stat.delivered_count / stat.total_messages) * 100).toFixed(2),
  //             )
  //           : 0,
  //     }));
  //
  //     return { result };
  //   } catch (error) {
  //     throw new HttpException(
  //       { message: 'Error fetching operator statistics', error: error.message },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
  //
  // private async sendSmsToProvider(message: SmsMessageEntity): Promise<void> {
  //   try {
  //     // Bu yerda real SMS provider API'si chaqiriladi
  //     // Masalan: Eskiz.uz, Play Mobile, SMS.uz va boshqalar
  //
  //     // Simulyatsiya uchun
  //     setTimeout(async () => {
  //       // Tasodifiy muvaffaqiyat/muvaffaqiyatsizlik
  //       const isSuccess = Math.random() > 0.1; // 90% muvaffaqiyat
  //
  //       if (isSuccess) {
  //         await this.updateMessageStatus(
  //           message.message_id,
  //           MessageStatusEnum.SENT,
  //         );
  //
  //         // Delivery report simulyatsiyasi
  //         setTimeout(async () => {
  //           const isDelivered = Math.random() > 0.05; // 95% yetkazib berish
  //           await this.updateMessageStatus(
  //             message.message_id,
  //             isDelivered
  //               ? MessageStatusEnum.DELIVERED
  //               : MessageStatusEnum.FAILED,
  //             { delivered_at: new Date() },
  //           );
  //         }, 2000);
  //       } else {
  //         await this.updateMessageStatus(
  //           message.message_id,
  //           MessageStatusEnum.FAILED,
  //           { error: 'Provider error' },
  //         );
  //       }
  //     }, 1000);
  //   } catch (error) {
  //     await this.updateMessageStatus(
  //       message.message_id,
  //       MessageStatusEnum.FAILED,
  //       { error: error.message },
  //     );
  //   }
  // }
}
