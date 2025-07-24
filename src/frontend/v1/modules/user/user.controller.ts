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
import {
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiBadRequestResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { UserService } from '../../../../service/user.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { User } from '../auth/decorators/user.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { ParamIdDto, SingleResponse } from '../../../../utils/dto/dto';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { UserEntity } from '../../../../entity/user.entity';
import { UpdateUserDto, UpdateBalanceDto } from './dto/user.dto';

@ApiTags('User Profile')
@ApiBearerAuth()
@Controller({ path: 'user', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(
    @User('id') userId: number,
  ): Promise<SingleResponse<UserEntity>> {
    return this.userService.getUserById(userId);
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Put('profile')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Body() updateUserDto: UpdateUserDto,
    @User('id') userId: number,
  ): Promise<SingleResponse<UserEntity>> {
    return this.userService.updateUser(userId, updateUserDto);
  }

  @Get('balance')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async getUserBalance(
    @User('id') userId: number,
  ): Promise<SingleResponse<{ balance: number }>> {
    const user = await this.userService.getUserById(userId);
    return { result: { balance: user.result.balance || 0 } };
  }

  @Get('statistics')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async getUserStatistics(@User('id') userId: number): Promise<
    SingleResponse<{
      total_sms: number;
      sent_sms: number;
      pending_sms: number;
      failed_sms: number;
      total_templates: number;
      approved_templates: number;
      total_transactions: number;
      completed_transactions: number;
      balance: number;
    }>
  > {
    // Bu yerda boshqa service lardan ma'lumot olish kerak
    // Hozircha mock data qaytaramiz
    const user = await this.userService.getUserById(userId);

    return {
      result: {
        total_sms: 0,
        sent_sms: 0,
        pending_sms: 0,
        failed_sms: 0,
        total_templates: 0,
        approved_templates: 0,
        total_transactions: 0,
        completed_transactions: 0,
        balance: user.result.balance || 0,
      },
    };
  }
}
