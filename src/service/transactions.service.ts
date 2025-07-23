import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { TransactionsEntity } from '../entity/transactions.entity';
import { UserEntity } from '../entity/user.entity';
import { PaginationBuilder } from '../utils/pagination.builder';
import { PaginationResponse } from '../utils/pagination.response';
import { SingleResponse } from '../utils/dto/dto';

export interface CreateTransactionDto {
  amount: number;
  payment_method: string;
  user_id: number;
}

export interface UpdateTransactionDto {
  amount?: number;
  payment_method?: string;
  status?: 'pending' | 'completed' | 'failed';
}

export interface TransactionFilters {
  status?: 'pending' | 'completed' | 'failed';
  user_id?: number;
  payment_method?: string;
  min_amount?: number;
  max_amount?: number;
  date_from?: Date;
  date_to?: Date;
}

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @Inject(MODELS.TRANSACTIONS)
    private readonly transactionRepo: Repository<TransactionsEntity>,
    @Inject(MODELS.USER)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async createTransaction(
    payload: CreateTransactionDto,
  ): Promise<SingleResponse<TransactionsEntity>> {
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

      const newTransaction = this.transactionRepo.create({
        ...payload,
        status: 'pending',
      });

      const result = await this.transactionRepo.save(newTransaction);

      this.logger.log(`New transaction created: ${result.id}`);
      return { result };
    } catch (error: any) {
      throw new HttpException(
        `Failed to create transaction: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllTransactions(
    page: number = 1,
    limit: number = 10,
    filters?: TransactionFilters,
  ): Promise<PaginationResponse<TransactionsEntity[]>> {
    try {
      const query = this.transactionRepo
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.user', 'user');

      if (filters?.status) {
        query.andWhere('transaction.status = :status', {
          status: filters.status,
        });
      }

      if (filters?.user_id) {
        query.andWhere('transaction.user_id = :user_id', {
          user_id: filters.user_id,
        });
      }

      if (filters?.payment_method) {
        query.andWhere('transaction.payment_method ILIKE :payment_method', {
          payment_method: `%${filters.payment_method}%`,
        });
      }

      if (filters?.min_amount) {
        query.andWhere('transaction.amount >= :min_amount', {
          min_amount: filters.min_amount,
        });
      }

      if (filters?.max_amount) {
        query.andWhere('transaction.amount <= :max_amount', {
          max_amount: filters.max_amount,
        });
      }

      if (filters?.date_from) {
        query.andWhere('transaction.created_at >= :date_from', {
          date_from: filters.date_from,
        });
      }

      if (filters?.date_to) {
        query.andWhere('transaction.created_at <= :date_to', {
          date_to: filters.date_to,
        });
      }

      query.orderBy('transaction.created_at', 'DESC');

      const [transactions, total] = await query
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return PaginationBuilder.build(transactions, page, limit, total);
    } catch (error: any) {
      throw new HttpException(
        `Failed to get transactions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTransactionById(
    id: number,
  ): Promise<SingleResponse<TransactionsEntity>> {
    try {
      const transaction = await this.transactionRepo.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!transaction) {
        throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
      }

      return { result: transaction };
    } catch (error: any) {
      throw new HttpException(
        `Failed to get transaction: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserTransactions(
    userId: number,
    page: number = 1,
    limit: number = 10,
    status?: 'pending' | 'completed' | 'failed',
  ): Promise<PaginationResponse<TransactionsEntity[]>> {
    try {
      const query = this.transactionRepo
        .createQueryBuilder('transaction')
        .where('transaction.user_id = :userId', { userId });

      if (status) {
        query.andWhere('transaction.status = :status', { status });
      }

      query.orderBy('transaction.created_at', 'DESC');

      const [transactions, total] = await query
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return PaginationBuilder.build(transactions, page, limit, total);
    } catch (error: any) {
      throw new HttpException(
        `Failed to get user transactions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateTransaction(
    id: number,
    payload: UpdateTransactionDto,
  ): Promise<SingleResponse<TransactionsEntity>> {
    try {
      const transaction = await this.transactionRepo.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!transaction) {
        throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
      }

      const oldStatus = transaction.status;
      Object.assign(transaction, payload);
      
      // Agar transaction completed bo'lsa, user balansini yangilash
      if (oldStatus !== 'completed' && payload.status === 'completed') {
        const user = transaction.user;
        user.balance = (user.balance || 0) + transaction.amount;
        await this.userRepo.save(user);
        this.logger.log(`User balance updated: ${user.id}, added: ${transaction.amount}`);
      }

      const result = await this.transactionRepo.save(transaction);

      this.logger.log(`Transaction updated: ${result.id}`);
      return { result };
    } catch (error: any) {
      throw new HttpException(
        `Failed to update transaction: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteTransaction(
    id: number,
  ): Promise<SingleResponse<{ message: string }>> {
    try {
      const transaction = await this.transactionRepo.findOne({
        where: { id },
      });

      if (!transaction) {
        throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
      }

      if (transaction.status === 'completed') {
        throw new HttpException(
          'Cannot delete completed transaction',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.transactionRepo.softDelete(id);

      this.logger.log(`Transaction deleted: ${id}`);
      return { result: { message: 'Transaction deleted successfully' } };
    } catch (error: any) {
      throw new HttpException(
        `Failed to delete transaction: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async approveTransaction(
    id: number,
  ): Promise<SingleResponse<TransactionsEntity>> {
    try {
      const transaction = await this.transactionRepo.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!transaction) {
        throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
      }

      if (transaction.status !== 'pending') {
        throw new HttpException(
          'Transaction is not in pending status',
          HttpStatus.BAD_REQUEST,
        );
      }

      transaction.status = 'completed';
      
      // User balansini yangilash
      const user = transaction.user;
      user.balance = (user.balance || 0) + transaction.amount;
      await this.userRepo.save(user);

      const result = await this.transactionRepo.save(transaction);

      this.logger.log(`Transaction approved: ${result.id}`);
      return { result };
    } catch (error: any) {
      throw new HttpException(
        `Failed to approve transaction: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async rejectTransaction(
    id: number,
  ): Promise<SingleResponse<TransactionsEntity>> {
    try {
      const transaction = await this.transactionRepo.findOne({
        where: { id },
      });

      if (!transaction) {
        throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
      }

      if (transaction.status !== 'pending') {
        throw new HttpException(
          'Transaction is not in pending status',
          HttpStatus.BAD_REQUEST,
        );
      }

      transaction.status = 'failed';
      const result = await this.transactionRepo.save(transaction);

      this.logger.log(`Transaction rejected: ${result.id}`);
      return { result };
    } catch (error: any) {
      throw new HttpException(
        `Failed to reject transaction: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTransactionStatistics(userId?: number): Promise<
    SingleResponse<{
      total_transactions: number;
      total_amount: number;
      pending_count: number;
      completed_count: number;
      failed_count: number;
      pending_amount: number;
      completed_amount: number;
    }>
  > {
    try {
      const query = this.transactionRepo.createQueryBuilder('transaction');

      if (userId) {
        query.where('transaction.user_id = :userId', { userId });
      }

      const [stats] = await query
        .select([
          'COUNT(*) as total_transactions',
          'SUM(transaction.amount) as total_amount',
          'SUM(CASE WHEN transaction.status = \'pending\' THEN 1 ELSE 0 END) as pending_count',
          'SUM(CASE WHEN transaction.status = \'completed\' THEN 1 ELSE 0 END) as completed_count',
          'SUM(CASE WHEN transaction.status = \'failed\' THEN 1 ELSE 0 END) as failed_count',
          'SUM(CASE WHEN transaction.status = \'pending\' THEN transaction.amount ELSE 0 END) as pending_amount',
          'SUM(CASE WHEN transaction.status = \'completed\' THEN transaction.amount ELSE 0 END) as completed_amount',
        ])
        .getRawOne();

      return {
        result: {
          total_transactions: parseInt(stats.total_transactions),
          total_amount: parseFloat(stats.total_amount) || 0,
          pending_count: parseInt(stats.pending_count),
          completed_count: parseInt(stats.completed_count),
          failed_count: parseInt(stats.failed_count),
          pending_amount: parseFloat(stats.pending_amount) || 0,
          completed_amount: parseFloat(stats.completed_amount) || 0,
        },
      };
    } catch (error: any) {
      throw new HttpException(
        `Failed to get transaction statistics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPaymentMethods(): Promise<SingleResponse<string[]>> {
    try {
      const methods = await this.transactionRepo
        .createQueryBuilder('transaction')
        .select('DISTINCT transaction.payment_method', 'payment_method')
        .getRawMany();

      const paymentMethods = methods.map((item) => item.payment_method);

      return { result: paymentMethods };
    } catch (error: any) {
      throw new HttpException(
        `Failed to get payment methods: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
