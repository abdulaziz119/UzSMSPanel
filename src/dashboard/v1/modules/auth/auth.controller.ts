import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiTags,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthService } from '../../../../service/auth.service';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { DashboardAuthLoginDto, DashboardAuthRegisterDto } from './dto/dto';
import { SingleResponse } from '../../../../utils/dto/dto';
import { UserEntity } from '../../../../entity/user.entity';
import { Roles } from './decorators/roles.decorator';
import { Auth } from './decorators/auth.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';

@ApiBearerAuth()
@ApiTags('Auth')
@Controller({ path: '/dashboard/auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponse({ type: ErrorResourceDto, status: 401 })
  @Post('/login')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @HttpCode(200)
  async login(
    @Body() body: DashboardAuthLoginDto,
  ): Promise<SingleResponse<{ id: number; role: string; token: string }>> {
    return await this.authService.dashboardLogin(body);
  }

  @ApiResponse({ type: ErrorResourceDto, status: 401 })
  @Post('/register')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @HttpCode(200)
  async register(
    @Body() body: DashboardAuthRegisterDto,
  ): Promise<SingleResponse<UserEntity>> {
    return await this.authService.register(body);
  }
}
