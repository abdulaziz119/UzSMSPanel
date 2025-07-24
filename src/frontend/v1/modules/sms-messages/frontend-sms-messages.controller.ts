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

  @Get('my-messages')
  @Auth()
  @HttpCode(HttpStatus.OK)
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

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Get('/findOne/:id')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async getSmsMessageById(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<SmsMessagesEntity>> {
    return this.smsMessagesService.getSmsMessageById(params.id);
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Post(':id/send')
  @Auth()
  async sendSmsMessage(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<SmsMessagesEntity>> {
    return this.smsMessagesService.sendSmsMessage(params.id);
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Put('/update/:id')
  @Auth()
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
  @HttpCode(HttpStatus.OK)
  async deleteSmsMessage(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<{ message: string }>> {
    return this.smsMessagesService.deleteSmsMessage(params.id);
  }

  @Get('statistics/overview')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async getSmsStatistics(@User('id') userId: number): Promise<
    SingleResponse<{
      total: number;
      pending: number;
      sent: number;
      failed: number;
    }>
  > {
    return this.smsMessagesService.getSmsStatistics(userId);
  }
}
