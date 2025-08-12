import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import {
  SingleResponse,
  PaginationParams,
  ParamIdDto,
} from '../../../../utils/dto/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { SmsTemplateEntity } from '../../../../entity/sms-template.entity';
import { User } from '../auth/decorators/user.decorator';
import { SmsTemplateService } from '../../../../service/sms-template.service';
import {
  CreateSmsTemplateDto,
  UpdateSmsTemplateDto,
} from '../../../../utils/dto/sms-template.dto';
import { PaginationResponse } from '../../../../utils/pagination.response';

@ApiBearerAuth()
@ApiTags('frontend-sms-template')
@Controller({ path: '/frontend/sms-template', version: '1' })
export class SmsTemplateController {
  constructor(private readonly smsTemplateService: SmsTemplateService) {}

  @Post('/create')
  @HttpCode(201)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async create(
    @Body() body: CreateSmsTemplateDto,
    @User('id') user_id: number,
  ): Promise<SingleResponse<SmsTemplateEntity>> {
    return await this.smsTemplateService.create(body, user_id);
  }

  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async findAll(
    @Body() query: PaginationParams,
  ): Promise<PaginationResponse<SmsTemplateEntity[]>> {
    return await this.smsTemplateService.findAll(query);
  }

  @Post('/findOne')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async findOne(
    @Body() param: ParamIdDto,
  ): Promise<SingleResponse<SmsTemplateEntity>> {
    return await this.smsTemplateService.findOne(param);
  }

  @Post('/update')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async update(
    @Body() body: UpdateSmsTemplateDto,
    @User('id') user_id: number,
  ): Promise<SingleResponse<SmsTemplateEntity>> {
    return await this.smsTemplateService.update(body, user_id);
  }

  @Post('/delete')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async delete(@Body() param: ParamIdDto): Promise<{ result: true }> {
    return await this.smsTemplateService.delete(param);
  }
}
