import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SingleResponse, ParamIdDto } from '../../../../utils/dto/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { GroupService } from '../../../../service/group.service';
import { GroupEntity } from '../../../../entity/group.entity';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { GroupFilterDto } from '../../../../utils/dto/group.dto';

@ApiBearerAuth()
@ApiTags('group')
@Controller({ path: '/dashboard/group', version: '1' })
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  /**
   * SMS guruhlar ro'yxati (admin) — filter + pagination
   */
  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async findAllGroups(
    @Body() filters: GroupFilterDto,
  ): Promise<PaginationResponse<GroupEntity[]>> {
    return await this.groupService.findAllGroups(filters);
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
  ): Promise<SingleResponse<GroupEntity>> {
    return await this.groupService.getGroupDetails(param.id);
  }

  /**
   * Guruhlar statistikasi
   */
  @Post('/statistics')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getGroupStatistics(): Promise<SingleResponse<any>> {
    return await this.groupService.getGroupStatistics();
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
  ): Promise<SingleResponse<GroupEntity[]>> {
    return await this.groupService.getUserGroups(body.user_id);
  }
}
