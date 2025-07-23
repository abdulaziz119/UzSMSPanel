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

  @ApiOperation({ summary: 'Create new SMS message' })
  @ApiResponse({ status: 201, description: 'SMS message created successfully' })
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Post()
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  @HttpCode(HttpStatus.CREATED)
  async createSmsMessage(
    @Body() createSmsMessageDto: CreateSmsMessageDto,
  ): Promise<SingleResponse<SmsMessagesEntity>> {
    return this.smsMessagesService.createSmsMessage(createSmsMessageDto);
  }

  @ApiOperation({ summary: 'Get all SMS messages' })
  @ApiResponse({ status: 200, description: 'SMS messages retrieved successfully' })
  @Get()
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  async getAllSmsMessages(
    @Query() query: SmsMessageQueryDto,
  ): Promise<PaginationResponse<SmsMessagesEntity[]>> {
    return this.smsMessagesService.getAllSmsMessages(
      query.page,
      query.limit,
      {
        status: query.status,
        user_id: query.user_id,
        recipient_phone: query.recipient_phone,
        date_from: query.date_from,
        date_to: query.date_to,
      },
    );
  }

  @ApiOperation({ summary: 'Get SMS message by ID' })
  @ApiResponse({ status: 200, description: 'SMS message retrieved successfully' })
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Get(':id')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  async getSmsMessageById(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<SmsMessagesEntity>> {
    return this.smsMessagesService.getSmsMessageById(params.id);
  }

  @ApiOperation({ summary: 'Send SMS message' })
  @ApiResponse({ status: 200, description: 'SMS message sent successfully' })
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

  @ApiOperation({ summary: 'Update SMS message' })
  @ApiResponse({ status: 200, description: 'SMS message updated successfully' })
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Put(':id')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  async updateSmsMessage(
    @Param() params: ParamIdDto,
    @Body() updateSmsMessageDto: UpdateSmsMessageDto,
  ): Promise<SingleResponse<SmsMessagesEntity>> {
    return this.smsMessagesService.updateSmsMessage(params.id, updateSmsMessageDto);
  }

  @ApiOperation({ summary: 'Delete SMS message' })
  @ApiResponse({ status: 200, description: 'SMS message deleted successfully' })
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Delete(':id')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  async deleteSmsMessage(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<{ message: string }>> {
    return this.smsMessagesService.deleteSmsMessage(params.id);
  }

  @ApiOperation({ summary: 'Get SMS statistics' })
  @ApiResponse({ status: 200, description: 'SMS statistics retrieved successfully' })
  @Get('statistics/overview')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  async getSmsStatistics(): Promise<SingleResponse<{
    total: number;
    pending: number;
    sent: number;
    failed: number;
  }>> {
    return this.smsMessagesService.getSmsStatistics();
  }
}
