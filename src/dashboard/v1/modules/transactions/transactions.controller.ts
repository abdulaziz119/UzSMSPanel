import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBadRequestResponse } from '@nestjs/swagger';
import { TransactionsService } from '../../../../service/transactions.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { ParamIdDto, SingleResponse } from '../../../../utils/dto/dto';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { TransactionsEntity } from '../../../../entity/transactions.entity';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQueryDto,
} from './dto/transactions.dto';

@ApiTags('Dashboard - Transactions')
@ApiBearerAuth()
@Controller({ path: '/dashboard/transactions', version: '1' })
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Post('/create')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<SingleResponse<TransactionsEntity>> {
    return this.transactionsService.createTransaction(createTransactionDto);
  }

  @Get('/findAll')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  @HttpCode(HttpStatus.OK)
  async getAllTransactions(
    @Query() query: TransactionQueryDto,
  ): Promise<PaginationResponse<TransactionsEntity[]>> {
    return this.transactionsService.getAllTransactions(
      query.page,
      query.limit,
      {
        status: query.status,
        user_id: query.user_id,
        payment_method: query.payment_method,
        min_amount: query.min_amount,
        max_amount: query.max_amount,
        date_from: query.date_from,
        date_to: query.date_to,
      },
    );
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Get('/findOne/:id')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  @HttpCode(HttpStatus.OK)
  async getTransactionById(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<TransactionsEntity>> {
    return this.transactionsService.getTransactionById(params.id);
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Put('/update/:id')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  async updateTransaction(
    @Param() params: ParamIdDto,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ): Promise<SingleResponse<TransactionsEntity>> {
    return this.transactionsService.updateTransaction(
      params.id,
      updateTransactionDto,
    );
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Delete('/delete/:id')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN)
  async deleteTransaction(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<{ message: string }>> {
    return this.transactionsService.deleteTransaction(params.id);
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Post(':id/approve')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async approveTransaction(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<TransactionsEntity>> {
    return this.transactionsService.approveTransaction(params.id);
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Post(':id/reject')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async rejectTransaction(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<TransactionsEntity>> {
    return this.transactionsService.rejectTransaction(params.id);
  }

  @Get('statistics/overview')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  async getTransactionStatistics(): Promise<
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
    return this.transactionsService.getTransactionStatistics();
  }

  @Get('payment-methods')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  async getPaymentMethods(): Promise<SingleResponse<string[]>> {
    return this.transactionsService.getPaymentMethods();
  }
}
