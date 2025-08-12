import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SingleResponse } from '../../../../utils/dto/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { User } from '../auth/decorators/user.decorator';
import { SmsGroupService } from '../../../../service/sms-group.service';
import { SmsGroupEntity } from '../../../../entity/sms-group.entity';

@ApiBearerAuth()
@ApiTags('Sms Group')
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
}
