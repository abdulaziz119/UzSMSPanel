import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { UserEntity } from '../entity/user.entity';
import { MessageEntity } from '../entity/message.entity';
import { TransactionEntity } from '../entity/transaction.entity';
import { SingleResponse } from '../utils/dto/dto';
import { UserRoleEnum } from '../utils/enum/user.enum';
import { MessageStatusEnum } from '../utils/enum/sms-message.enum';
import {
  TransactionStatusEnum,
  TransactionTypeEnum,
} from '../utils/enum/transaction.enum';
import { DashboardStatsFilterDto } from '../utils/dto/statistics.dto';

@Injectable()
export class StatisticsService {
  constructor(
    @Inject(MODELS.USER)
    private readonly userRepo: Repository<UserEntity>,
    @Inject(MODELS.MESSAGE)
    private readonly messageRepo: Repository<MessageEntity>,
    @Inject(MODELS.TRANSACTION)
    private readonly transactionRepo: Repository<TransactionEntity>,
  ) {}

  async getDashboardStatistics(
    filters?: DashboardStatsFilterDto,
  ): Promise<SingleResponse<any>> {
    try {
      const totalUsers: number = await this.userRepo.count();
      const clientUsers: number = await this.userRepo.count({
        where: { role: UserRoleEnum.CLIENT },
      });
      const activeUsers: number = await this.userRepo.count({
        where: { block: false },
      });

      const totalSmsCount: number = await this.messageRepo.count();
      const deliveredSmsCount: number = await this.messageRepo.count({
        where: { status: MessageStatusEnum.DELIVERED },
      });
      const failedSmsCount: number = await this.messageRepo.count({
        where: { status: MessageStatusEnum.FAILED },
      });

      const totalCampaigns = 0;
      const activeCampaigns = 0;
      const completedCampaigns = 0;

      const totalRevenue = await this.transactionRepo
        .createQueryBuilder('transaction')
        .select('SUM(transaction.amount)', 'total')
        .where('transaction.type = :type', {
          type: TransactionTypeEnum.SMS_PAYMENT,
        })
        .andWhere('transaction.status = :status', {
          status: TransactionStatusEnum.COMPLETED,
        })
        .getRawOne();

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayUsers: number = await this.userRepo
        .createQueryBuilder('user')
        .where('user.created_at >= :today', { today })
        .andWhere('user.created_at < :tomorrow', { tomorrow })
        .getCount();

      const todaySms = await this.messageRepo
        .createQueryBuilder('message')
        .where('message.created_at >= :today', { today })
        .andWhere('message.created_at < :tomorrow', { tomorrow })
        .getCount();

      const todayRevenue = await this.transactionRepo
        .createQueryBuilder('transaction')
        .select('SUM(ABS(transaction.amount))', 'total')
        .where('transaction.type = :type', {
          type: TransactionTypeEnum.SMS_PAYMENT,
        })
        .andWhere('transaction.status = :status', {
          status: TransactionStatusEnum.COMPLETED,
        })
        .andWhere('transaction.created_at >= :today', { today })
        .andWhere('transaction.created_at < :tomorrow', { tomorrow })
        .getRawOne();

      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);

      const weeklyStats = await this.getWeeklyStatistics(last7Days);

      const statistics = {
        users: {
          total: totalUsers,
          clients: clientUsers,
          active: activeUsers,
          new_today: todayUsers,
        },
        sms: {
          total_sent: totalSmsCount,
          delivered: deliveredSmsCount,
          failed: failedSmsCount,
          sent_today: todaySms,
          delivery_rate:
            totalSmsCount > 0 ? (deliveredSmsCount / totalSmsCount) * 100 : 0,
        },
        campaigns: {
          total: totalCampaigns,
          active: activeCampaigns,
          completed: completedCampaigns,
        },
        revenue: {
          total: Math.abs(parseFloat(totalRevenue.total) || 0),
          today: parseFloat(todayRevenue.total) || 0,
        },
        weekly_stats: weeklyStats,
      };

      return { result: statistics };
    } catch (error) {
      throw new HttpException(
        {
          message: 'Error fetching dashboard statistics',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getSmsReports(
    filters?: DashboardStatsFilterDto,
  ): Promise<SingleResponse<any>> {
    try {
      let dateCondition: string = '';
      const params: any = {};

      if (filters?.date_from && filters?.date_to) {
        dateCondition =
          'AND message.created_at BETWEEN :date_from AND :date_to';
        params.date_from = filters.date_from;
        params.date_to = filters.date_to;
      } else if (filters?.period) {
        const { condition, param } = this.getPeriodCondition(filters.period);
        dateCondition = condition;
        Object.assign(params, param);
      }

      const operatorStats = await this.messageRepo
        .createQueryBuilder('message')
        .select([
          'message.operator as operator',
          'COUNT(*) as total_count',
          'SUM(CASE WHEN message.status = :delivered THEN 1 ELSE 0 END) as delivered_count',
          'SUM(CASE WHEN message.status = :failed THEN 1 ELSE 0 END) as failed_count',
          'SUM(message.cost) as total_cost',
        ])
        .where(`1=1 ${dateCondition}`)
        .setParameters({
          delivered: MessageStatusEnum.DELIVERED,
          failed: MessageStatusEnum.FAILED,
          ...params,
        })
        .groupBy('message.operator')
        .getRawMany();

      const dailyStats = await this.messageRepo
        .createQueryBuilder('message')
        .select([
          'DATE(message.created_at) as date',
          'COUNT(*) as total_count',
          'SUM(CASE WHEN message.status = :delivered THEN 1 ELSE 0 END) as delivered_count',
          'SUM(message.cost) as total_cost',
        ])
        .where('message.created_at >= :last30Days')
        .setParameters({
          delivered: MessageStatusEnum.DELIVERED,
          last30Days: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        })
        .groupBy('DATE(message.created_at)')
        .orderBy('date', 'DESC')
        .limit(30)
        .getRawMany();

      return {
        result: {
          operator_statistics: operatorStats,
          daily_statistics: dailyStats,
        },
      };
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching SMS reports', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getRevenueReports(
    filters?: DashboardStatsFilterDto,
  ): Promise<SingleResponse<any>> {
    try {
      let dateCondition: string = '';
      const params: any = {};

      if (filters?.date_from && filters?.date_to) {
        dateCondition =
          'AND transaction.created_at BETWEEN :date_from AND :date_to';
        params.date_from = filters.date_from;
        params.date_to = filters.date_to;
      }

      const totalRevenue = await this.transactionRepo
        .createQueryBuilder('transaction')
        .select('SUM(ABS(transaction.amount))', 'total')
        .where('transaction.type = :type')
        .andWhere('transaction.status = :status')
        .andWhere(`1=1 ${dateCondition}`)
        .setParameters({
          type: TransactionTypeEnum.SMS_PAYMENT,
          status: TransactionStatusEnum.COMPLETED,
          ...params,
        })
        .getRawOne();

      const paymentMethodStats = await this.transactionRepo
        .createQueryBuilder('transaction')
        .select([
          'transaction.payment_method as method',
          'COUNT(*) as transaction_count',
          'SUM(transaction.amount) as total_amount',
        ])
        .where('transaction.type = :type')
        .andWhere('transaction.status = :status')
        .andWhere(`1=1 ${dateCondition}`)
        .setParameters({
          type: TransactionTypeEnum.DEPOSIT,
          status: TransactionStatusEnum.COMPLETED,
          ...params,
        })
        .groupBy('transaction.payment_method')
        .getRawMany();

      const monthlyRevenue = await this.transactionRepo
        .createQueryBuilder('transaction')
        .select([
          'YEAR(transaction.created_at) as year',
          'MONTH(transaction.created_at) as month',
          'SUM(ABS(transaction.amount)) as total_amount',
          'COUNT(*) as transaction_count',
        ])
        .where('transaction.type = :type')
        .andWhere('transaction.status = :status')
        .andWhere('transaction.created_at >= :last12Months')
        .setParameters({
          type: TransactionTypeEnum.SMS_PAYMENT,
          status: TransactionStatusEnum.COMPLETED,
          last12Months: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000),
        })
        .groupBy('YEAR(transaction.created_at), MONTH(transaction.created_at)')
        .orderBy('year, month', 'DESC')
        .getRawMany();

      return {
        result: {
          total_revenue: parseFloat(totalRevenue.total) || 0,
          payment_method_statistics: paymentMethodStats,
          monthly_revenue: monthlyRevenue,
        },
      };
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching revenue reports', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async getWeeklyStatistics(fromDate: Date) {
    const weeklyUsers: number = await this.userRepo
      .createQueryBuilder('user')
      .where('user.created_at >= :fromDate', { fromDate })
      .getCount();

    const weeklySms = await this.messageRepo
      .createQueryBuilder('message')
      .where('message.created_at >= :fromDate', { fromDate })
      .getCount();

    const weeklyRevenue = await this.transactionRepo
      .createQueryBuilder('transaction')
      .select('SUM(ABS(transaction.amount))', 'total')
      .where('transaction.type = :type', {
        type: TransactionTypeEnum.SMS_PAYMENT,
      })
      .andWhere('transaction.status = :status', {
        status: TransactionStatusEnum.COMPLETED,
      })
      .andWhere('transaction.created_at >= :fromDate', { fromDate })
      .getRawOne();

    return {
      new_users: weeklyUsers,
      sms_sent: weeklySms,
      revenue: parseFloat(weeklyRevenue.total) || 0,
    };
  }

  private getPeriodCondition(period: string) {
    const now = new Date();
    let condition: string = '';
    let param = {};

    switch (period) {
      case 'today':
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        condition = 'AND message.created_at >= :today';
        param = { today };
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        condition = 'AND message.created_at >= :weekAgo';
        param = { weekAgo };
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        condition = 'AND message.created_at >= :monthAgo';
        param = { monthAgo };
        break;
      case 'year':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        condition = 'AND message.created_at >= :yearAgo';
        param = { yearAgo };
        break;
    }

    return { condition, param };
  }
}
