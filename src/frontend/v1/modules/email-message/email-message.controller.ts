import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { EmailMessageService } from '../../../../service/email-message.service';
import { SendEmailDto, EmailMessageQueryDto } from '../../../../utils/dto/email-message.dto';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Auth } from '../auth/decorators/auth.decorator';
import { User } from '../auth/decorators/user.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { ParamIdDto } from '../../../../utils/dto/dto';
import { PaginationResponse } from '../../../../utils/pagination.response';

@ApiBearerAuth()
@ApiTags('email-message')
@Controller({ path: '/frontend/email-message', version: '1' })
export class EmailMessageController {
  constructor(private readonly emailMessageService: EmailMessageService) {}

  @Post('/send')
  @HttpCode(201)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async sendEmail(
    @Body() body: SendEmailDto,
    @User('id') user_id: number,
  ) {
    return this.emailMessageService.sendEmail(user_id, body);
  }

  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async findAll(
    @Body() query: EmailMessageQueryDto,
    @User('id') user_id: number,
  ): Promise<PaginationResponse<any[]>> {
    return this.emailMessageService.findAll(user_id, query);
  }

  @Post('/stats')
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async getEmailStats(
    @User('id') user_id: number,
  ) {
    return this.emailMessageService.getEmailStats(user_id);
  }

  @Post('/findOne')
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async findOne(
    @Body() param: ParamIdDto,
    @User('id') user_id: number,
  ) {
    return this.emailMessageService.findOne(user_id, param.id);
  }

  @Post('/retry')
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async retryFailedEmail(
    @Body() param: ParamIdDto,
    @User('id') user_id: number,
  ) {
    return this.emailMessageService.retryFailedEmail(user_id, param.id);
  }
}
