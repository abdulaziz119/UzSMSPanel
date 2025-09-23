import {
  Inject,
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { TransactionEntity } from '../entity/transaction.entity';
import { UserEntity } from '../entity/user.entity';
import { SingleResponse } from '../utils/dto/dto';
import { PaginationResponse } from '../utils/pagination.response';
import { getPaginationResponse } from '../utils/pagination.builder';
import {
  TransactionStatusEnum,
  TransactionTypeEnum,
  PaymentMethodEnum,
} from '../utils/enum/transaction.enum';
import {
  AdminTopUpDto,
  TopUpBalanceDto,
  TransactionFilterDto,
  TransactionStatsDto,
} from '../utils/dto/transaction.dto';
import { UserRoleEnum } from '../utils/enum/user.enum';

import { ContactEntity } from '../entity/contact.entity';
import { ContactTypeEnum } from '../utils/enum/contact.enum';

@Injectable()
export class TransactionService {
  constructor(
    @Inject(MODELS.TRANSACTION)
    private readonly transactionRepo: Repository<TransactionEntity>,
    @Inject(MODELS.USER)
    private readonly userRepo: Repository<UserEntity>,
    @Inject(MODELS.CONTACT)
    private readonly contactRepo: Repository<ContactEntity>,
  ) {}

  async getBalance(
    user_id: number,
    balance_type: ContactTypeEnum,
  ): Promise<SingleResponse<{ balance: number }>> {
    try {
      if (!balance_type) {
        throw new BadRequestException('balance_type header is required');
      }

      const balanceColumn =
        balance_type === ContactTypeEnum.INDIVIDUAL
          ? 'individual_balance'
          : 'company_balance';

      const contact = await this.contactRepo.findOne({
        where: { user_id: user_id, type: balance_type },
        select: [balanceColumn],
      });

      if (!contact) {
        throw new HttpException(
          { message: 'Contact not found for the specified balance type' },
          HttpStatus.NOT_FOUND,
        );
      }

      return { result: { balance: contact[balanceColumn] || 0 } };
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching balance', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async topUpBalance(
    payload: TopUpBalanceDto,
    user_id: number,
  ): Promise<SingleResponse<{ transaction_id: number; new_balance: number }>> {
    try {
      const contact: ContactEntity = await this.contactRepo.findOne({
        where: { user_id: user_id, type: payload.balance_type },
      });
      if (!contact) {
        throw new HttpException(
          { message: 'Contact not found for the specified balance type' },
          HttpStatus.NOT_FOUND,
        );
      }

      if (payload.amount <= 0) {
        throw new BadRequestException('Amount must be greater than 0');
      }

      const balanceColumn =
        payload.balance_type === ContactTypeEnum.INDIVIDUAL
          ? 'individual_balance'
          : 'company_balance';

      const balance_before = Number(contact[balanceColumn] || 0);
      const balance_after = balance_before + payload.amount;

      const transaction: TransactionEntity = this.transactionRepo.create({
        user_id,
        transaction_id: this.generateExternalTransactionId(),
        type: TransactionTypeEnum.DEPOSIT,
        amount: payload.amount,
        status: TransactionStatusEnum.PENDING,
        balance_before: balance_before,
        balance_after: balance_after,
        payment_method: payload.payment_method,
        description: payload.description || 'Balance top-up',
        external_transaction_id: this.generateExternalTransactionId(),
      });

      const savedTransaction: TransactionEntity =
        await this.transactionRepo.save(transaction);

      await this.processPayment(savedTransaction);

      await this.contactRepo.update(contact.id, {
        [balanceColumn]: balance_after,
      });

      await this.transactionRepo.update(savedTransaction.id, {
        status: TransactionStatusEnum.COMPLETED,
      });

      return {
        result: {
          transaction_id: savedTransaction.id,
          new_balance: balance_after,
        },
      };
    } catch (error) {
      throw new HttpException(
        { message: 'Error processing top-up', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTransactionHistory(
    filters: TransactionFilterDto,
    user_id?: number,
  ): Promise<PaginationResponse<TransactionEntity[]>> {
    const { page = 1, limit = 20 } = filters;
    const skip: number = (page - 1) * limit;

    try {
      const queryBuilder = this.transactionRepo
        .createQueryBuilder('transaction')
        .orderBy('transaction.created_at', 'DESC');

      if (user_id) {
        queryBuilder.where('transaction.user_id = :user_id', { user_id });
      }

      if (filters.user_id) {
        queryBuilder.andWhere('transaction.user_id = :filter_user_id', {
          filter_user_id: filters.user_id,
        });
      }

      if (filters.date_from) {
        queryBuilder.andWhere('transaction.created_at >= :date_from', {
          date_from: filters.date_from,
        });
      }

      if (filters.date_to) {
        queryBuilder.andWhere('transaction.created_at <= :date_to', {
          date_to: filters.date_to,
        });
      }

      if (filters.type) {
        queryBuilder.andWhere('transaction.type = :type', {
          type: filters.type,
        });
      }

      if (filters.status) {
        queryBuilder.andWhere('transaction.status = :status', {
          status: filters.status,
        });
      }

      if (filters.payment_method) {
        queryBuilder.andWhere('transaction.payment_method = :payment_method', {
          payment_method: filters.payment_method,
        });
      }

      if (filters.search) {
        queryBuilder.andWhere(
          '(transaction.description ILIKE :search OR transaction.external_transaction_id ILIKE :search)',
          { search: `%${filters.search}%` },
        );
      }

      const total: number = await queryBuilder.getCount();
      const transactions: TransactionEntity[] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getMany();

      return getPaginationResponse(transactions, total, page, limit);
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching transaction history', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTransactionDetails(
    id: number,
  ): Promise<SingleResponse<TransactionEntity>> {
    try {
      const transaction: TransactionEntity = await this.transactionRepo.findOne(
        {
          where: { id },
          relations: ['user'],
        },
      );

      if (!transaction) {
        throw new HttpException(
          { message: 'Transaction not found' },
          HttpStatus.NOT_FOUND,
        );
      }

      return { result: transaction };
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching transaction details', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTransactionStatistics(
    filters: TransactionStatsDto,
  ): Promise<SingleResponse<any>> {
    try {
      const queryBuilder =
        this.transactionRepo.createQueryBuilder('transaction');

      if (filters.date_from) {
        queryBuilder.andWhere('transaction.created_at >= :date_from', {
          date_from: filters.date_from,
        });
      }

      if (filters.date_to) {
        queryBuilder.andWhere('transaction.created_at <= :date_to', {
          date_to: filters.date_to,
        });
      }

      if (filters.user_id) {
        queryBuilder.andWhere('transaction.user_id = :user_id', {
          user_id: filters.user_id,
        });
      }

      if (filters.type) {
        queryBuilder.andWhere('transaction.type = :type', {
          type: filters.type,
        });
      }

      if (filters.payment_method) {
        queryBuilder.andWhere('transaction.payment_method = :payment_method', {
          payment_method: filters.payment_method,
        });
      }

      const statistics = await queryBuilder
        .select([
          'COUNT(*) as total_transactions',
          'SUM(CASE WHEN type = :deposit THEN amount ELSE 0 END) as total_deposits',
          'SUM(CASE WHEN type = :sms_payment THEN amount ELSE 0 END) as total_expenses',
          'SUM(CASE WHEN status = :completed THEN amount ELSE 0 END) as completed_amount',
          'SUM(CASE WHEN status = :pending THEN amount ELSE 0 END) as pending_amount',
          'SUM(CASE WHEN status = :failed THEN amount ELSE 0 END) as failed_amount',
          'AVG(amount) as average_amount',
        ])
        .setParameters({
          deposit: TransactionTypeEnum.DEPOSIT,
          sms_payment: TransactionTypeEnum.SMS_PAYMENT,
          completed: TransactionStatusEnum.COMPLETED,
          pending: TransactionStatusEnum.PENDING,
          failed: TransactionStatusEnum.FAILED,
        })
        .getRawOne();

      const result = {
        ...statistics,
        success_rate:
          statistics.total_transactions > 0
            ? parseFloat(
                (
                  ((statistics.total_transactions - statistics.failed_amount) /
                    statistics.total_transactions) *
                  100
                ).toFixed(2),
              )
            : 0,
      };

      return { result };
    } catch (error) {
      throw new HttpException(
        {
          message: 'Error fetching transaction statistics',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async adminTopUp(
    data: AdminTopUpDto,
  ): Promise<SingleResponse<{ message: string; new_balance: number }>> {
    try {
      const contact: ContactEntity = await this.contactRepo.findOne({
        where: { user_id: data.user_id, type: data.balance_type },
      });

      if (!contact) {
        throw new HttpException(
          { message: 'Contact not found for the specified balance type' },
          HttpStatus.NOT_FOUND,
        );
      }
      const balanceColumn =
        data.balance_type === ContactTypeEnum.INDIVIDUAL
          ? 'individual_balance'
          : 'company_balance';

      const new_balance: number =
        Number(contact[balanceColumn] || 0) + data.amount;

      const transaction: TransactionEntity = this.transactionRepo.create({
        user_id: data.user_id,
        external_transaction_id: this.generateExternalTransactionId(),
        amount: data.amount,
        type: TransactionTypeEnum.DEPOSIT,
        status: TransactionStatusEnum.COMPLETED,
        payment_method: PaymentMethodEnum.SYSTEM,
        description: data.description || 'Admin top-up',
        processed_at: new Date(),
        balance_before: Number(contact[balanceColumn] || 0),
        balance_after: new_balance,
      });

      await this.transactionRepo.save(transaction);

      await this.contactRepo.update(contact.id, {
        [balanceColumn]: new_balance,
      });

      return {
        result: {
          message: 'Balance topped up successfully',
          new_balance,
        },
      };
    } catch (error) {
      throw new HttpException(
        { message: 'Error processing admin top-up', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getRevenueReports(
    filters: TransactionStatsDto,
  ): Promise<SingleResponse<any>> {
    try {
      const queryBuilder =
        this.transactionRepo.createQueryBuilder('transaction');

      if (filters.date_from) {
        queryBuilder.andWhere('transaction.created_at >= :date_from', {
          date_from: filters.date_from,
        });
      }

      if (filters.date_to) {
        queryBuilder.andWhere('transaction.created_at <= :date_to', {
          date_to: filters.date_to,
        });
      }

      queryBuilder.andWhere('transaction.status = :completed', {
        completed: TransactionStatusEnum.COMPLETED,
      });

      let groupByField: string = 'DATE(transaction.created_at)';
      if (filters.group_by === 'week') {
        groupByField = "DATE_TRUNC('week', transaction.created_at)";
      } else if (filters.group_by === 'month') {
        groupByField = "DATE_TRUNC('month', transaction.created_at)";
      }

      const revenueData = await queryBuilder
        .select([
          `${groupByField} as period`,
          'SUM(CASE WHEN type = :deposit THEN amount ELSE 0 END) as deposits',
          'SUM(CASE WHEN type = :sms_payment THEN amount ELSE 0 END) as expenses',
          'COUNT(*) as transaction_count',
        ])
        .setParameters({
          deposit: TransactionTypeEnum.DEPOSIT,
          sms_payment: TransactionTypeEnum.SMS_PAYMENT,
        })
        .groupBy(groupByField)
        .orderBy(groupByField, 'ASC')
        .getRawMany();

      const totalRevenue = revenueData.reduce(
        (sum, item) => sum + parseFloat(item.deposits),
        0,
      );
      const totalExpenses = revenueData.reduce(
        (sum, item) => sum + parseFloat(item.expenses),
        0,
      );
      const netRevenue: number = totalRevenue - totalExpenses;

      const result = {
        revenue_data: revenueData,
        summary: {
          total_revenue: totalRevenue,
          total_expenses: totalExpenses,
          net_revenue: netRevenue,
          period_count: revenueData.length,
        },
      };

      return { result };
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching revenue reports', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPaymentMethodStatistics(
    filters: TransactionStatsDto,
  ): Promise<SingleResponse<any>> {
    try {
      const queryBuilder =
        this.transactionRepo.createQueryBuilder('transaction');

      if (filters.date_from) {
        queryBuilder.andWhere('transaction.created_at >= :date_from', {
          date_from: filters.date_from,
        });
      }

      if (filters.date_to) {
        queryBuilder.andWhere('transaction.created_at <= :date_to', {
          date_to: filters.date_to,
        });
      }

      queryBuilder.andWhere('transaction.status = :completed', {
        completed: TransactionStatusEnum.COMPLETED,
      });

      const paymentStats = await queryBuilder
        .select([
          'transaction.payment_method as payment_method',
          'COUNT(*) as transaction_count',
          'SUM(amount) as total_amount',
          'AVG(amount) as average_amount',
        ])
        .groupBy('transaction.payment_method')
        .orderBy('total_amount', 'DESC')
        .getRawMany();

      const totalAmount = paymentStats.reduce(
        (sum, item) => sum + parseFloat(item.total_amount),
        0,
      );

      const result = paymentStats.map((stat) => ({
        ...stat,
        percentage:
          totalAmount > 0
            ? parseFloat(((stat.total_amount / totalAmount) * 100).toFixed(2))
            : 0,
      }));

      return { result };
    } catch (error) {
      throw new HttpException(
        {
          message: 'Error fetching payment method statistics',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserBalanceSummary(): Promise<SingleResponse<any>> {
    throw new HttpException(
      'This method is deprecated.',
      HttpStatus.GONE,
    );
  }

  private generateExternalTransactionId(): string {
    return `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private async processPayment(transaction: TransactionEntity): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const isSuccess: boolean = Math.random() > 0.05;

        if (!isSuccess) {
          this.transactionRepo.update(transaction.id, {
            status: TransactionStatusEnum.FAILED,
            processed_at: new Date(),
          });
        }

        resolve();
      }, 2000); // 2 soniya kutish
    });
  }
}
