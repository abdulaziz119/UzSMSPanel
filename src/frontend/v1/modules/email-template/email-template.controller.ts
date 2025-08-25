import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { EmailTemplateService } from '../../../../service/email-template.service';
import {
  CreateEmailTemplateDto,
  EmailTemplateQueryDto,
} from '../../../../utils/dto/email-template.dto';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Auth } from '../auth/decorators/auth.decorator';
import { User } from '../auth/decorators/user.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { SingleResponse } from '../../../../utils/dto/dto';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { EmailTemplateEntity } from '../../../../entity/email-template.entity';

@ApiBearerAuth()
@ApiTags('email-template')
@Controller({ path: '/frontend/email-template', version: '1' })
export class EmailTemplateController {
  constructor(private readonly emailTemplateService: EmailTemplateService) {}

  @Post('/create')
  @HttpCode(201)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async create(
    @Body() body: CreateEmailTemplateDto,
    @User('id') user_id: number,
  ): Promise<SingleResponse<EmailTemplateEntity>> {
    return await this.emailTemplateService.create(user_id, body);
  }

  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async findAll(
    @Body() query: EmailTemplateQueryDto,
    @User('id') user_id: number,
  ): Promise<PaginationResponse<EmailTemplateEntity[]>> {
    return this.emailTemplateService.findAll(user_id, query);
  }
}
