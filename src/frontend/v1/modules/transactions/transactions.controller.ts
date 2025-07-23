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
import {
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiBadRequestResponse,
  ApiOperation,
} from '@nestjs/swagger';
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

  @ApiOperation({ summary: 'Create new transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Post()
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

  @ApiOperation({ summary: 'Get user transactions' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  @Get('my-transactions')
  @Auth()
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

  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, description: 'Transaction retrieved successfully' })
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Get(':id')
  @Auth()
  async getTransactionById(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<TransactionsEntity>> {
    return this.transactionsService.getTransactionById(params.id);
  }

  @ApiOperation({ summary: 'Get transaction statistics' })
  @ApiResponse({ status: 200, description: 'Transaction statistics retrieved successfully' })
  @Get('statistics/overview')
  @Auth()
  async getTransactionStatistics(
    @User('id') userId: number,
  ): Promise<SingleResponse<{
    total_transactions: number;
    total_amount: number;
    pending_count: number;
    completed_count: number;
    failed_count: number;
    pending_amount: number;
    completed_amount: number;
  }>> {
    return this.transactionsService.getTransactionStatistics(userId);
  }

  @ApiOperation({ summary: 'Get available payment methods' })
  @ApiResponse({ status: 200, description: 'Payment methods retrieved successfully' })
  @Get('payment-methods')
  @Auth()
  async getPaymentMethods(): Promise<SingleResponse<string[]>> {
    return this.transactionsService.getPaymentMethods();
  }
}
