import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SingleResponse } from '../../../../utils/dto/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { User } from '../auth/decorators/user.decorator';
import { 
  TransactionService
} from '../../../../service/transaction.service';
import { TransactionEntity } from '../../../../entity/transaction.entity';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { 
  TopUpBalanceDto, 
  TransactionFilterDto 
} from '../../../../utils/dto/transaction.dto';

@ApiBearerAuth()
@ApiTags('frontend-transaction')
@Controller({ path: '/frontend/transaction', version: '1' })
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('/balance')
  @HttpCode(200)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async getBalance(
    @User('id') user_id: number,
  ): Promise<SingleResponse<{ balance: number }>> {
    return await this.transactionService.getBalance(user_id);
  }

  @Post('/topup')
  @HttpCode(200)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async topUpBalance(
    @Body() body: TopUpBalanceDto,
    @User('id') user_id: number,
  ): Promise<SingleResponse<{ transaction_id: number; new_balance: number }>> {
    return await this.transactionService.topUpBalance(body, user_id);
  }

  @Post('/history')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async getTransactionHistory(
    @Body() filters: TransactionFilterDto,
    @User('id') user_id: number,
  ): Promise<PaginationResponse<TransactionEntity[]>> {
    return await this.transactionService.getTransactionHistory(filters, user_id);
  }

  @Post('/statistics')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async getTransactionStatistics(
    @User('id') user_id: number,
  ): Promise<SingleResponse<any>> {
    return await this.transactionService.getTransactionStatistics({ user_id });
  }
}
