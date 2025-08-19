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

@Injectable()
export class TransactionService {
  constructor(
    @Inject(MODELS.TRANSACTION)
    private readonly transactionRepo: Repository<TransactionEntity>,
    @Inject(MODELS.USER)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async getBalance(
    user_id: number,
  ): Promise<SingleResponse<{ balance: number }>> {
    try {
      const user = await this.userRepo.findOne({
        where: { id: user_id },
        select: ['balance'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return { result: { balance: user.balance } };
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
      const user = await this.userRepo.findOne({ where: { id: user_id } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (payload.amount <= 0) {
        throw new BadRequestException('Amount must be greater than 0');
      }

      // Tranzaktsiya yaratish
      const transaction = this.transactionRepo.create({
        user_id,
        transaction_id: this.generateExternalTransactionId(),
        type: TransactionTypeEnum.DEPOSIT,
        amount: payload.amount,
        status: TransactionStatusEnum.PENDING,
        balance_before: user.balance,
        balance_after: user.balance + payload.amount,
        payment_method: payload.payment_method,
        description: payload.description || 'Balance top-up',
        external_transaction_id: this.generateExternalTransactionId(),
      });

      const savedTransaction = await this.transactionRepo.save(transaction);

      // Bu yerda to'lov tizimi bilan integratsiya bo'lishi kerak
      // Hozircha simulyatsiya qilamiz
      await this.processPayment(savedTransaction);

      // Balansni yangilash (to'lov muvaffaqiyatli bo'lsa)
      const newBalance = user.balance + payload.amount;
      await this.userRepo.update(user_id, { balance: newBalance });

      // Tranzaktsiya statusini yangilash
      await this.transactionRepo.update(savedTransaction.id, {
        status: TransactionStatusEnum.COMPLETED,
      });

      return {
        result: {
          transaction_id: savedTransaction.id,
          new_balance: newBalance,
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
    const skip = (page - 1) * limit;

    try {
      const queryBuilder = this.transactionRepo
        .createQueryBuilder('transaction')
        .orderBy('transaction.created_at', 'DESC');

      // Add user filter only if user_id is provided
      if (user_id) {
        queryBuilder.where('transaction.user_id = :user_id', { user_id });
      }

      // Apply additional filters from dashboard
      if (filters.user_id) {
        queryBuilder.andWhere('transaction.user_id = :filter_user_id', {
          filter_user_id: filters.user_id,
        });
      }

      // Filtrlarni qo'llash
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

      const total = await queryBuilder.getCount();
      const transactions = await queryBuilder.skip(skip).take(limit).getMany();

      return getPaginationResponse(transactions, total, page, limit);
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching transaction history', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createSmsTransaction(
    user_id: number,
    amount: number,
    description: string,
    reference_id?: string,
    sms_message_id?: number,
  ): Promise<TransactionEntity> {
    try {
      const transaction = this.transactionRepo.create({
        user_id,
        transaction_id: this.generateExternalTransactionId(),
        type: TransactionTypeEnum.SMS_PAYMENT,
        amount: -Math.abs(amount), // Manfiy qiymat (xarajat)
        status: TransactionStatusEnum.COMPLETED,
        balance_before: 0, // Bu yerda haqiqiy balansni olish kerak
        balance_after: 0, // Bu yerda yangi balansni hisoblash kerak
        description,
        sms_message_id: sms_message_id ?? null,
      });

      return await this.transactionRepo.save(transaction);
    } catch (error) {
      throw new HttpException(
        { message: 'Error creating SMS transaction', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Dashboard-specific methods
  async getTransactionDetails(
    id: number,
  ): Promise<SingleResponse<TransactionEntity>> {
    try {
      const transaction = await this.transactionRepo.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
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
      const user = await this.userRepo.findOne({ where: { id: data.user_id } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Create transaction record
      const transaction = this.transactionRepo.create({
        user_id: data.user_id,
        external_transaction_id: this.generateExternalTransactionId(),
        amount: data.amount,
        type: TransactionTypeEnum.DEPOSIT,
        status: TransactionStatusEnum.COMPLETED,
        payment_method: PaymentMethodEnum.SYSTEM,
        description: data.description || 'Admin top-up',
        processed_at: new Date(),
      });

      await this.transactionRepo.save(transaction);

      // Update user balance
      const new_balance = user.balance + data.amount;
      await this.userRepo.update(data.user_id, { balance: new_balance });

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

      let groupByField = 'DATE(transaction.created_at)';
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

      // Calculate total revenue
      const totalRevenue = revenueData.reduce(
        (sum, item) => sum + parseFloat(item.deposits),
        0,
      );
      const totalExpenses = revenueData.reduce(
        (sum, item) => sum + parseFloat(item.expenses),
        0,
      );
      const netRevenue = totalRevenue - totalExpenses;

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

      // Add percentage to each payment method
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
    try {
      const balanceStats = await this.userRepo
        .createQueryBuilder('user')
        .select([
          'COUNT(*) as total_users',
          'SUM(balance) as total_balance',
          'AVG(balance) as average_balance',
          'MAX(balance) as max_balance',
          'MIN(balance) as min_balance',
          'COUNT(CASE WHEN balance > 0 THEN 1 ELSE NULL END) as users_with_balance',
          'COUNT(CASE WHEN balance = 0 THEN 1 ELSE NULL END) as users_zero_balance',
          'COUNT(CASE WHEN balance < 0 THEN 1 ELSE NULL END) as users_negative_balance',
        ])
        .where('role = :role', { role: 'CLIENT' })
        .getRawOne();

      // Get balance distribution
      const balanceDistribution = await this.userRepo
        .createQueryBuilder('user')
        .select([
          'CASE ' +
            "WHEN balance = 0 THEN '0' " +
            "WHEN balance <= 1000 THEN '1-1000' " +
            "WHEN balance <= 5000 THEN '1001-5000' " +
            "WHEN balance <= 10000 THEN '5001-10000' " +
            "WHEN balance <= 50000 THEN '10001-50000' " +
            "ELSE '50000+' END as balance_range",
          'COUNT(*) as user_count',
        ])
        .where('role = :role', { role: 'CLIENT' })
        .groupBy('balance_range')
        .orderBy('balance_range')
        .getRawMany();

      const result = {
        summary: balanceStats,
        distribution: balanceDistribution,
      };

      return { result };
    } catch (error) {
      throw new HttpException(
        {
          message: 'Error fetching user balance summary',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private generateExternalTransactionId(): string {
    return `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private async processPayment(transaction: TransactionEntity): Promise<void> {
    // Bu yerda real to'lov tizimi bilan integratsiya bo'lishi kerak
    // Masalan: Click, Payme, Uzcard va boshqalar

    // Simulyatsiya uchun
    return new Promise((resolve) => {
      setTimeout(() => {
        // 95% muvaffaqiyat
        const isSuccess = Math.random() > 0.05;

        if (!isSuccess) {
          // To'lov muvaffaqiyatsiz
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
