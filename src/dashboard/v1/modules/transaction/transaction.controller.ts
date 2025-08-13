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

  @Post('/details')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getTransactionDetails(
    @Body() param: ParamIdDto,
  ): Promise<SingleResponse<TransactionEntity>> {
    return await this.transactionService.getTransactionDetails(param.id);
  }

  @Post('/statistics')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getTransactionStatistics(
    @Body() filters: TransactionStatsDto,
  ): Promise<SingleResponse<any>> {
    return await this.transactionService.getTransactionStatistics(filters);
  }

  @Post('/admin-topup')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async adminTopUp(
    @Body() body: AdminTopUpDto,
  ): Promise<SingleResponse<{ message: string; new_balance: number }>> {
    return await this.transactionService.adminTopUp(body);
  }

  @Post('/revenue-reports')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getRevenueReports(
    @Body() filters: TransactionStatsDto,
  ): Promise<SingleResponse<any>> {
    return await this.transactionService.getRevenueReports(filters);
  }

  @Post('/payment-method-stats')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getPaymentMethodStatistics(
    @Body() filters: TransactionStatsDto,
  ): Promise<SingleResponse<any>> {
    return await this.transactionService.getPaymentMethodStatistics(filters);
  }

  @Post('/user-balance-summary')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getUserBalanceSummary(): Promise<SingleResponse<any>> {
    return await this.transactionService.getUserBalanceSummary();
  }
}
