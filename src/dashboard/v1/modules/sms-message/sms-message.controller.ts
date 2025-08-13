import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SingleResponse, ParamIdDto } from '../../../../utils/dto/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { 
  SmsMessageService
} from '../../../../service/sms-message.service';
import { SmsMessageEntity } from '../../../../entity/sms-message.entity';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { 
  MessageFilterDto,
  MessageStatsDto 
} from '../../../../utils/dto/sms-message.dto';

@ApiBearerAuth()
@ApiTags('dashboard-sms-message')
@Controller({ path: '/dashboard/sms-message', version: '1' })
export class SmsMessageController {
  constructor(private readonly smsMessageService: SmsMessageService) {}

  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async findAllMessages(
    @Body() filters: MessageFilterDto,
  ): Promise<PaginationResponse<SmsMessageEntity[]>> {
    return await this.smsMessageService.getMessageHistory(filters);
  }

  @Post('/details')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getMessageDetails(
    @Body() param: ParamIdDto,
  ): Promise<SingleResponse<SmsMessageEntity>> {
    return await this.smsMessageService.getMessageDetails(param.id);
  }

  @Post('/statistics')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getMessageStatistics(
    @Body() filters: MessageStatsDto,
  ): Promise<SingleResponse<any>> {
    return await this.smsMessageService.getMessageStatistics(filters);
  }

  @Post('/resend')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async resendMessage(
    @Body() param: ParamIdDto,
  ): Promise<SingleResponse<{ message: string }>> {
    return await this.smsMessageService.resendMessage(param.id);
  }

  @Post('/bulk-resend')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async bulkResend(
    @Body() body: { message_ids: number[] },
  ): Promise<SingleResponse<{ message: string; resent_count: number }>> {
    return await this.smsMessageService.bulkResend(body.message_ids);
  }

  @Post('/operator-statistics')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getOperatorStatistics(
    @Body() filters: MessageStatsDto,
  ): Promise<SingleResponse<any>> {
    return await this.smsMessageService.getOperatorStatistics(filters);
  }
}
