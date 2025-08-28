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
import { GroupEntity } from '../../../../entity/group.entity';
import { User } from '../auth/decorators/user.decorator';
import { GroupService } from '../../../../service/group.service';
import { PaginationResponse } from '../../../../utils/pagination.response';
import {
  CreateGroupDto,
  UpdateGroupDto,
} from '../../../../utils/dto/group.dto';

@ApiBearerAuth()
@ApiTags('group')
@Controller({ path: '/frontend/group', version: '1' })
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post('/create')
  @HttpCode(201)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async create(
    @Body() body: CreateGroupDto,
    @User('id') user_id: number,
  ): Promise<SingleResponse<GroupEntity>> {
    return await this.groupService.create(body, user_id);
  }

  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async findAll(
    @Body() query: PaginationParams,
  ): Promise<PaginationResponse<GroupEntity[]>> {
    return await this.groupService.findAll(query);
  }

  @Post('/update')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async update(
    @Body() body: UpdateGroupDto,
    @User('id') user_id: number,
  ): Promise<SingleResponse<GroupEntity>> {
    return await this.groupService.update(body, user_id);
  }

  @Post('/delete')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async delete(@Body() param: ParamIdDto): Promise<{ result: true }> {
    return await this.groupService.delete(param);
  }
}
