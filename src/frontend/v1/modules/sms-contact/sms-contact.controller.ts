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
import { SmsContactEntity } from '../../../../entity/sms-contact.entity';
import { SmsContactService } from '../../../../service/sms-contact.service';
import {
  CreateSmsContactDto,
  UpdateSmsContactDto,
} from '../../../../utils/dto/sms-contact.dto';
import { PaginationResponse } from '../../../../utils/pagination.response';

@ApiBearerAuth()
@ApiTags('frontend-sms-contact')
@Controller({ path: '/frontend/sms-contact', version: '1' })
export class SmsContactController {
  constructor(private readonly smsContactService: SmsContactService) {}

  @Post('/create')
  @HttpCode(201)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async create(
    @Body() body: CreateSmsContactDto,
  ): Promise<SingleResponse<SmsContactEntity>> {
    return await this.smsContactService.create(body);
  }

  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async findAll(
    @Body() query: PaginationParams,
  ): Promise<PaginationResponse<SmsContactEntity[]>> {
    return await this.smsContactService.findAll(query);
  }

  @Post('/findOne')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async findOne(
    @Body() param: ParamIdDto,
  ): Promise<SingleResponse<SmsContactEntity>> {
    return await this.smsContactService.findOne(param);
  }

  @Post('/update')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async update(
    @Body() body: UpdateSmsContactDto,
  ): Promise<SingleResponse<SmsContactEntity>> {
    return await this.smsContactService.update(body);
  }

  @Post('/delete')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async delete(@Body() param: ParamIdDto): Promise<{ result: true }> {
    return await this.smsContactService.delete(param);
  }
}
