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
import { User } from '../auth/decorators/user.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { ParamIdDto, SingleResponse } from '../../../../utils/dto/dto';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { SmsMessagesEntity } from '../../../../entity/sms-messages.entity';
import {
  CreateSmsMessageDto,
  UpdateSmsMessageDto,
  SmsMessageQueryDto,
} from './dto/frontend-sms-messages.dto';

@ApiTags('SMS Messages')
@ApiBearerAuth()
@Controller({ path: 'sms-messages', version: '1' })
export class SmsMessagesController {
  constructor(private readonly smsMessagesService: SmsMessagesService) {}

  @ApiOperation({ summary: 'Create new SMS message' })
  @ApiResponse({ status: 201, description: 'SMS message created successfully' })
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Post()
  @Auth()
  @HttpCode(HttpStatus.CREATED)
  async createSmsMessage(
    @Body() createSmsMessageDto: CreateSmsMessageDto,
    @User('id') userId: number,
  ): Promise<SingleResponse<SmsMessagesEntity>> {
    return this.smsMessagesService.createSmsMessage({
      ...createSmsMessageDto,
      user_id: userId,
    });
  }

  @ApiOperation({ summary: 'Get user SMS messages' })
  @ApiResponse({ status: 200, description: 'SMS messages retrieved successfully' })
  @Get('my-messages')
  @Auth()
  async getUserSmsMessages(
    @Query() query: SmsMessageQueryDto,
    @User('id') userId: number,
  ): Promise<PaginationResponse<SmsMessagesEntity[]>> {
    return this.smsMessagesService.getUserSmsMessages(
      userId,
      query.page,
      query.limit,
      query.status,
    );
  }

  @ApiOperation({ summary: 'Get SMS message by ID' })
  @ApiResponse({ status: 200, description: 'SMS message retrieved successfully' })
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Get(':id')
  @Auth()
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
  async deleteSmsMessage(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<{ message: string }>> {
    return this.smsMessagesService.deleteSmsMessage(params.id);
  }

  @ApiOperation({ summary: 'Get SMS statistics' })
  @ApiResponse({ status: 200, description: 'SMS statistics retrieved successfully' })
  @Get('statistics/overview')
  @Auth()
  async getSmsStatistics(
    @User('id') userId: number,
  ): Promise<SingleResponse<{
    total: number;
    pending: number;
    sent: number;
    failed: number;
  }>> {
    return this.smsMessagesService.getSmsStatistics(userId);
  }
}
