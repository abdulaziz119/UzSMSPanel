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
import { SmsGroupEntity } from '../../../../entity/sms-group.entity';
import { User } from '../auth/decorators/user.decorator';
import { SmsGroupService } from '../../../../service/sms-group.service';
import {
  CreateSmsGroupDto,
  UpdateSmsGroupDto,
} from '../../../../utils/dto/sms-group.dto';
import { PaginationResponse } from '../../../../utils/pagination.response';

@ApiBearerAuth()
@ApiTags('frontend-sms-group')
@Controller({ path: '/frontend/sms-group', version: '1' })
export class SmsGroupController {
  constructor(private readonly smsGroupService: SmsGroupService) {}

  @Post('/create')
  @HttpCode(201)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async create(
    @Body() body: CreateSmsGroupDto,
    @User('id') user_id: number,
  ): Promise<SingleResponse<SmsGroupEntity>> {
    return await this.smsGroupService.create(body, user_id);
  }

  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async findAll(
    @Body() query: PaginationParams,
  ): Promise<PaginationResponse<SmsGroupEntity[]>> {
    return await this.smsGroupService.findAll(query);
  }

  @Post('/findOne')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async findOne(
    @Body() param: ParamIdDto,
  ): Promise<SingleResponse<SmsGroupEntity>> {
    return await this.smsGroupService.findOne(param);
  }

  @Post('/update')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async update(
    @Body() body: UpdateSmsGroupDto,
    @User('id') user_id: number,
  ): Promise<SingleResponse<SmsGroupEntity>> {
    return await this.smsGroupService.update(body, user_id);
  }

  @Post('/delete')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async delete(@Body() param: ParamIdDto): Promise<{ result: true }> {
    return await this.smsGroupService.delete(param);
  }
}
