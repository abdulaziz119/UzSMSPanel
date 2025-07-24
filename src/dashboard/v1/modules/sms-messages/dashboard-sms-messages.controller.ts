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
import { SmsMessagesService } from '../../../../service/sms-messages.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { ParamIdDto, SingleResponse } from '../../../../utils/dto/dto';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { SmsMessagesEntity } from '../../../../entity/sms-messages.entity';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import {
  CreateSmsMessageDto,
  UpdateSmsMessageDto,
  SmsMessageQueryDto,
} from './dto/dashboard-sms-messages.dto';

@ApiTags('Dashboard - SMS Messages')
@ApiBearerAuth()
@Controller({ path: '/dashboard/sms-messages', version: '1' })
export class SmsMessagesController {
  constructor(private readonly smsMessagesService: SmsMessagesService) {}

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Post('/create')
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  @HttpCode(HttpStatus.CREATED)
  @Auth()
  async createSmsMessage(
    @Body() createSmsMessageDto: CreateSmsMessageDto,
  ): Promise<SingleResponse<SmsMessagesEntity>> {
    return this.smsMessagesService.createSmsMessage(createSmsMessageDto);
  }

  @Get('/findAll')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  @HttpCode(HttpStatus.OK)
  async getAllSmsMessages(
    @Query() query: SmsMessageQueryDto,
  ): Promise<PaginationResponse<SmsMessagesEntity[]>> {
    return this.smsMessagesService.getAllSmsMessages(query.page, query.limit, {
      status: query.status,
      user_id: query.user_id,
      recipient_phone: query.recipient_phone,
      date_from: query.date_from,
      date_to: query.date_to,
    });
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Get('/findOne/:id')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  @HttpCode(HttpStatus.OK)
  async getSmsMessageById(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<SmsMessagesEntity>> {
    return this.smsMessagesService.getSmsMessageById(params.id);
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Post(':id/send')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  @HttpCode(HttpStatus.OK)
  async sendSmsMessage(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<SmsMessagesEntity>> {
    return this.smsMessagesService.sendSmsMessage(params.id);
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Put('/update/:id')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateSmsMessage(
    @Param() params: ParamIdDto,
    @Body() updateSmsMessageDto: UpdateSmsMessageDto,
  ): Promise<SingleResponse<SmsMessagesEntity>> {
    return this.smsMessagesService.updateSmsMessage(
      params.id,
      updateSmsMessageDto,
    );
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Delete('/delete/:id')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteSmsMessage(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<{ message: string }>> {
    return this.smsMessagesService.deleteSmsMessage(params.id);
  }

  @Get('statistics/overview')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  async getSmsStatistics(): Promise<
    SingleResponse<{
      total: number;
      pending: number;
      sent: number;
      failed: number;
    }>
  > {
    return this.smsMessagesService.getSmsStatistics();
  }
}
