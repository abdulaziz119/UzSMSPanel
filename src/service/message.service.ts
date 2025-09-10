import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { MessageEntity } from '../entity/message.entity';
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
export class MessageService {
  constructor(
    @Inject(MODELS.MESSAGE)
    private readonly messageRepo: Repository<MessageEntity>,
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
  ): Promise<MessageEntity> {
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
      const msg: MessageEntity = em.getRepository(MessageEntity).create({
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
      const saved: MessageEntity = await em
        .getRepository(MessageEntity)
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
          message_id: saved.id,
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
  ): Promise<MessageEntity[]> {
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
          const repo = em.getRepository(MessageEntity);

          // Create entities in batches to avoid memory issues
          const CHUNK_SIZE = 1000;
          const savedMessages: MessageEntity[] = [];

          for (let i: number = 0; i < smsDataArray.length; i += CHUNK_SIZE) {
            const chunk = smsDataArray.slice(i, i + CHUNK_SIZE);
            const toSave: MessageEntity[] = chunk.map((smsData) =>
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

            const chunkSaved: MessageEntity[] = await repo.save(toSave, {
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
              message_id: null,
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
  ): Promise<PaginationResponse<MessageEntity[]>> {
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

      return getPaginationResponse<MessageEntity>(messages, page, limit, total);
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching SMS history', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private generateExternalTransactionId(): string {
    return `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }
}
