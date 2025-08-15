import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SingleResponse, ParamIdDto } from '../../../../utils/dto/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { SmsGroupService } from '../../../../service/sms-group.service';
import { SmsGroupEntity } from '../../../../entity/sms-group.entity';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { GroupFilterDto } from '../../../../utils/dto/sms-group.dto';

@ApiBearerAuth()
@ApiTags('sms-group')
@Controller({ path: '/dashboard/sms-group', version: '1' })
export class SmsGroupController {
  constructor(private readonly smsGroupService: SmsGroupService) {}

  /**
   * SMS guruhlar ro'yxati (admin) — filter + pagination
   */
  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async findAllGroups(
    @Body() filters: GroupFilterDto,
  ): Promise<PaginationResponse<SmsGroupEntity[]>> {
    return await this.smsGroupService.findAllGroups(filters);
  }

  /**
   * Guruh tafsilotlari (ID bo'yicha)
   */
  @Post('/details')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getGroupDetails(
    @Body() param: ParamIdDto,
  ): Promise<SingleResponse<SmsGroupEntity>> {
    return await this.smsGroupService.getGroupDetails(param.id);
  }

  /**
   * Guruhlar statistikasi
   */
  @Post('/statistics')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getGroupStatistics(): Promise<SingleResponse<any>> {
    return await this.smsGroupService.getGroupStatistics();
  }

  /**
   * Muayyan foydalanuvchining guruhlari
   */
  @Post('/user-groups')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getUserGroups(
    @Body() body: { user_id: number },
  ): Promise<SingleResponse<SmsGroupEntity[]>> {
    return await this.smsGroupService.getUserGroups(body.user_id);
  }
}
