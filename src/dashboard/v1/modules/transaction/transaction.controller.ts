import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SingleResponse, ParamIdDto } from '../../../../utils/dto/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { 
  TransactionService
} from '../../../../service/transaction.service';
import { TransactionEntity } from '../../../../entity/transaction.entity';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { 
  TransactionFilterDto,
  TransactionStatsDto,
  AdminTopUpDto 
} from '../../../../utils/dto/transaction.dto';

@ApiBearerAuth()
@ApiTags('dashboard-transaction')
@Controller({ path: '/dashboard/transaction', version: '1' })
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  /**
   * Barcha tranzaksiyalar ro'yxati (admin) — filter + pagination
   */
  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async findAllTransactions(
    @Body() filters: TransactionFilterDto,
  ): Promise<PaginationResponse<TransactionEntity[]>> {
    // For admin, don't require user_id - they can see all transactions
    return await this.transactionService.getTransactionHistory(filters, null);
  }

  /**
   * Tranzaksiya tafsilotlari (ID bo'yicha)
   */
  @Post('/details')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getTransactionDetails(
    @Body() param: ParamIdDto,
  ): Promise<SingleResponse<TransactionEntity>> {
    return await this.transactionService.getTransactionDetails(param.id);
  }

  /**
   * Tranzaksiyalar statistikasi (admin)
   */
  @Post('/statistics')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getTransactionStatistics(
    @Body() filters: TransactionStatsDto,
  ): Promise<SingleResponse<any>> {
    return await this.transactionService.getTransactionStatistics(filters);
  }

  /**
   * Admin tomonidan balans to'ldirish (ma'lum foydalanuvchiga)
   */
  @Post('/admin-topup')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async adminTopUp(
    @Body() body: AdminTopUpDto,
  ): Promise<SingleResponse<{ message: string; new_balance: number }>> {
    return await this.transactionService.adminTopUp(body);
  }

  /**
   * Daromadlar (revenue) bo'yicha hisobot
   */
  @Post('/revenue-reports')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getRevenueReports(
    @Body() filters: TransactionStatsDto,
  ): Promise<SingleResponse<any>> {
    return await this.transactionService.getRevenueReports(filters);
  }

  /**
   * To'lov usullari bo'yicha statistika (payme, click va h.k.)
   */
  @Post('/payment-method-stats')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getPaymentMethodStatistics(
    @Body() filters: TransactionStatsDto,
  ): Promise<SingleResponse<any>> {
    return await this.transactionService.getPaymentMethodStatistics(filters);
  }

  /**
   * Foydalanuvchilar balansining umumiy ko'rinishi (summalar bo'yicha)
   */
  @Post('/user-balance-summary')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getUserBalanceSummary(): Promise<SingleResponse<any>> {
    return await this.transactionService.getUserBalanceSummary();
  }
}
