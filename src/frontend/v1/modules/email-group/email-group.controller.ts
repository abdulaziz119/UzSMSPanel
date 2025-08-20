import {
  Controller,
  Post,
  Body,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { EmailGroupService } from '../../../../service/email-group.service';
import { CreateEmailGroupDto, UpdateEmailGroupDto, EmailGroupQueryDto } from '../../../../utils/dto/email-group.dto';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Auth } from '../auth/decorators/auth.decorator';
import { User } from '../auth/decorators/user.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { ParamIdDto, PaginationParams, SingleResponse } from '../../../../utils/dto/dto';
import { PaginationResponse } from '../../../../utils/pagination.response';

@ApiBearerAuth()
@ApiTags('email-group')
@Controller({ path: '/frontend/email-group', version: '1' })
export class EmailGroupController {
  constructor(private readonly emailGroupService: EmailGroupService) {}

  @Post('/create')
  @HttpCode(201)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async create(
    @Body() body: CreateEmailGroupDto,
    @User('id') user_id: number,
  ): Promise<SingleResponse<any>> {
    const result = await this.emailGroupService.create(user_id, body);
    return { result };
  }

  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async findAll(
    @Body() query: EmailGroupQueryDto,
    @User('id') user_id: number,
  ): Promise<PaginationResponse<any[]>> {
    return await this.emailGroupService.findAll(user_id, query);
  }

  @Post('/update')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async update(
    @Body() body: UpdateEmailGroupDto & { id: number },
    @User('id') user_id: number,
  ): Promise<SingleResponse<any>> {
    const result = await this.emailGroupService.update(user_id, body.id, body);
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
    await this.emailGroupService.remove(user_id, param.id);
    return { result: true };
  }
}
