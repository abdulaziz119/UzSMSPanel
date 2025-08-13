import { Body, Controller, HttpCode, Post, Get, Query, Headers } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse, ApiResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SingleResponse, PaginationParams } from '../../../../utils/dto/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { User } from '../auth/decorators/user.decorator';
import { 
  SmsMessageService,
} from '../../../../service/sms-message.service';
import { SmsMessageEntity } from '../../../../entity/sms-message.entity';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { 
  SendSingleSmsDto, 
  SendBulkSmsDto, 
  SmsHistoryFilterDto 
} from '../../../../utils/dto/sms-message.dto';

@ApiBearerAuth()
@ApiTags('frontend-sms-message')
@Controller({ path: '/frontend/sms-message', version: '1' })
export class SmsMessageController {
  constructor(private readonly messageService: SmsMessageService) {}

  @Post('/send-single')
  @HttpCode(200)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async sendSingle(
    @Body() body: SendSingleSmsDto,
    @User('id') user_id: number,
  ): Promise<SingleResponse<{ message_id: string; cost: number }>> {
    return await this.messageService.sendSingle(body, user_id);
  }

  @Post('send-bulk')
  @HttpCode(200)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  @ApiResponse({ status: 201, description: 'Bulk messages sent successfully' })
  async sendBulk(
    @Body() body: SendBulkSmsDto,
    @User('id') user_id: number,
  ) {
    // Convert string date to Date object for service
    const convertedBody = {
      ...body,
      scheduled_at: body.scheduled_at ? new Date(body.scheduled_at) : undefined,
    };
    return await this.messageService.sendBulk(convertedBody, user_id);
  }

  @Post('/history')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async getHistory(
    @Body() filters: SmsHistoryFilterDto,
    @User('id') user_id: number,
  ): Promise<PaginationResponse<SmsMessageEntity[]>> {
    return await this.messageService.getHistory(filters, user_id);
  }

  @Post('/statistics')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async getStatistics(
    @User('id') user_id: number,
  ): Promise<SingleResponse<any>> {
    return await this.messageService.getStatistics(user_id);
  }
}
