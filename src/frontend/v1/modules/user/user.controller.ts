import { Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserEntity } from '../../../../entity/user.entity';
import { UserService } from '../../../../service/user.service';
import { SingleResponse } from '../../../../utils/dto/dto';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { Auth } from '../auth/decorators/auth.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../auth/decorators/user.decorator';

@ApiBearerAuth()
@ApiTags('Users')
@Controller({ path: '/frontend/user', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/me')
  @HttpCode(200)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async getMe(
    @User('id') user_id: number,
  ): Promise<SingleResponse<UserEntity>> {
    return await this.userService.getMe(user_id);
  }
}
