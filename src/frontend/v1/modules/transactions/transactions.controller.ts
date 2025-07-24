import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBadRequestResponse } from '@nestjs/swagger';
import { TransactionsService } from '../../../../service/transactions.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { User } from '../auth/decorators/user.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { ParamIdDto, SingleResponse } from '../../../../utils/dto/dto';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { TransactionsEntity } from '../../../../entity/transactions.entity';
import {
  CreateTransactionDto,
  TransactionQueryDto,
} from './dto/transactions.dto';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller({ path: 'transactions', version: '1' })
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Post('/create')
  @Auth()
  @HttpCode(HttpStatus.CREATED)
  async createTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
    @User('id') userId: number,
  ): Promise<SingleResponse<TransactionsEntity>> {
    return this.transactionsService.createTransaction({
      ...createTransactionDto,
      user_id: userId,
    });
  }

  @Get('my-transactions')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async getUserTransactions(
    @Query() query: TransactionQueryDto,
    @User('id') userId: number,
  ): Promise<PaginationResponse<TransactionsEntity[]>> {
    return this.transactionsService.getUserTransactions(
      userId,
      query.page,
      query.limit,
      query.status,
    );
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Get('/findOne/:id')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async getTransactionById(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<TransactionsEntity>> {
    return this.transactionsService.getTransactionById(params.id);
  }

  @Get('statistics/overview')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async getTransactionStatistics(@User('id') userId: number): Promise<
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
    return this.transactionsService.getTransactionStatistics(userId);
  }

  @Get('payment-methods')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async getPaymentMethods(): Promise<SingleResponse<string[]>> {
    return this.transactionsService.getPaymentMethods();
  }
}
