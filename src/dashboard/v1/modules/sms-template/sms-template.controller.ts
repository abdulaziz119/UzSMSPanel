import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBadRequestResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { PaginationResponse } from '../../../../utils/pagination.response';
import {
  PaginationParams,
  ParamIdDto,
  SingleResponse,
} from '../../../../utils/dto/dto';
import { SmsTemplateEntity } from '../../../../entity/sms-template.entity';
import { SmsTemplateService } from '../../../../service/sms-template.service';
import { UpdateSmsTemplateDto } from '../../../../utils/dto/sms-template.dto';

@ApiBearerAuth()
@ApiTags('dashboard-sms-template')
@Controller({ path: '/dashboard/sms-template', version: '1' })
export class SmsTemplateDashboardController {
  constructor(private readonly smsTemplateService: SmsTemplateService) {}

  /**
   * Shablonlar ro'yxati (pagination)
   */
  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async findAll(
    @Body() query: PaginationParams,
  ): Promise<PaginationResponse<SmsTemplateEntity[]>> {
    return await this.smsTemplateService.findAll(query);
  }

  /**
   * Bitta shablon tafsilotlari
   */
  @Post('/findOne')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async findOne(
    @Body() param: ParamIdDto,
  ): Promise<SingleResponse<SmsTemplateEntity>> {
    return await this.smsTemplateService.findOne(param);
  }

  /**
   * Shablonni yangilash
   */
  @Post('/update')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async update(
    @Body() body: UpdateSmsTemplateDto & { user_id: number },
  ): Promise<SingleResponse<SmsTemplateEntity>> {
    return await this.smsTemplateService.update(body, body.user_id);
  }

  /**
   * Shablonni o'chirish
   */
  @Post('/delete')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async delete(@Body() param: ParamIdDto): Promise<{ result: true }> {
    return await this.smsTemplateService.delete(param);
  }
}
