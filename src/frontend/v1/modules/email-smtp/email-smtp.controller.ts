import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { EmailSmtpService } from '../../../../service/email-smtp.service';
import { CreateEmailSmtpDto, UpdateEmailSmtpDto, EmailSmtpQueryDto } from '../../../../utils/dto/email-smtp.dto';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Auth } from '../auth/decorators/auth.decorator';
import { User } from '../auth/decorators/user.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { ParamIdDto, SingleResponse } from '../../../../utils/dto/dto';
import { PaginationResponse } from '../../../../utils/pagination.response';

@ApiBearerAuth()
@ApiTags('email-smtp')
@Controller({ path: '/frontend/email-smtp', version: '1' })
export class EmailSmtpController {
  constructor(private readonly emailSmtpService: EmailSmtpService) {}

  @Post('/create')
  @HttpCode(201)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async create(
    @Body() body: CreateEmailSmtpDto,
    @User('id') user_id: number,
  ): Promise<SingleResponse<any>> {
    const result = await this.emailSmtpService.create(user_id, body);
    return { result };
  }

  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async findAll(
    @Body() query: EmailSmtpQueryDto,
    @User('id') user_id: number,
  ): Promise<PaginationResponse<any[]>> {
    return await this.emailSmtpService.findAll(user_id, query);
  }

  @Post('/update')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async update(
    @Body() body: UpdateEmailSmtpDto & { id: number },
    @User('id') user_id: number,
  ): Promise<SingleResponse<any>> {
    const result = await this.emailSmtpService.update(user_id, body.id, body);
    return { result };
  }

  @Post('/delete')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async delete(
    @Body() param: ParamIdDto,
    @User('id') user_id: number,
  ): Promise<{ result: true }> {
    await this.emailSmtpService.remove(user_id, param.id);
    return { result: true };
  }

  @Post('/test')
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async testConnection(
    @Body() param: ParamIdDto,
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.emailSmtpService.testConnection(param.id);
    return { success: result, message: 'SMTP connection successful' };
  }

  @Post('/active/list')
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async getActiveSmtp(
    @User('id') user_id: number,
  ) {
    return this.emailSmtpService.getActiveSmtp(user_id);
  }
}
