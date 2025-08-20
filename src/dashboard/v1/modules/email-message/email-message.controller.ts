import {
  Controller,
  Post,
  Body,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { EmailMessageService } from '../../../../service/email-message.service';
import { EmailMessageQueryDto } from '../../../../utils/dto/email-message.dto';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Auth } from '../auth/decorators/auth.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { ParamIdDto } from '../../../../utils/dto/dto';
import { PaginationResponse } from '../../../../utils/pagination.response';

@ApiBearerAuth()
@ApiTags('email-message')
@Controller({ path: '/dashboard/email-message', version: '1' })
export class EmailMessageDashboardController {
  constructor(private readonly emailMessageService: EmailMessageService) {}

  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async findAll(
    @Body() query: EmailMessageQueryDto,
  ): Promise<PaginationResponse<any[]>> {
    return this.emailMessageService.findAllForAdmin(query);
  }

  @Post('/stats')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getEmailStats() {
    return this.emailMessageService.getGlobalEmailStats();
  }

  @Post('/findOne')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async findOne(
    @Body() param: ParamIdDto,
  ) {
    return this.emailMessageService.findOneForAdmin(param.id);
  }

  @Post('/retry')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async retryFailedEmail(
    @Body() param: ParamIdDto,
  ) {
    return this.emailMessageService.retryFailedEmailForAdmin(param.id);
  }

  @Post('/bulk-retry')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async bulkRetryFailedEmails(
    @Body() body: { message_ids: number[] },
  ) {
    return this.emailMessageService.bulkRetryFailedEmails(body.message_ids);
  }

  @Post('/delete')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async deleteEmail(
    @Body() param: ParamIdDto,
  ) {
    return this.emailMessageService.deleteEmailMessage(param.id);
  }
}
