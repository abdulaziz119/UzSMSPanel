import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { User } from '../auth/decorators/user.decorator';
import { SmsMessageService } from '../../../../service/sms-message.service';
import { SmsMessageEntity } from '../../../../entity/sms-message.entity';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { SmsHistoryFilterDto } from '../../../../utils/dto/sms-message.dto';

@ApiBearerAuth()
@ApiTags('sms-message')
@Controller({ path: '/frontend/sms-message', version: '1' })
export class SmsMessageController {
  constructor(private readonly messageService: SmsMessageService) {}
  @Post('/history')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async getHistory(
    @Body() filters: SmsHistoryFilterDto,
    @User('id') user_id: number,
  ): Promise<PaginationResponse<SmsMessageEntity[]>> {
    return await this.messageService.getHistory(filters, user_id, false);
  }
}
