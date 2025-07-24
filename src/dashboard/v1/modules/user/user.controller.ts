import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBadRequestResponse } from '@nestjs/swagger';
import { UserService } from '../../../../service/user.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { ParamIdDto, SingleResponse } from '../../../../utils/dto/dto';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { UserEntity } from '../../../../entity/user.entity';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateBalanceDto,
  UserQueryDto,
} from './dto/user.dto';

@ApiTags('Dashboard - Users')
@ApiBearerAuth()
@Controller({ path: '/dashboard/users', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Post('create')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<SingleResponse<UserEntity>> {
    return this.userService.createUser(createUserDto);
  }

  @Get('findAll')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  @HttpCode(HttpStatus.OK)
  async getAllUsers(
    @Query() query: UserQueryDto,
  ): Promise<PaginationResponse<UserEntity[]>> {
    return this.userService.getAllUsers(
      query.page,
      query.limit,
      query.role,
      query.search,
    );
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Get('/findOne/:id')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  @HttpCode(HttpStatus.OK)
  async getUserById(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<UserEntity>> {
    return this.userService.getUserById(params.id);
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Put('/update/:id')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Param() params: ParamIdDto,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<SingleResponse<UserEntity>> {
    return this.userService.updateUser(params.id, updateUserDto);
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Delete('/delete/:id')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteUser(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<{ message: string }>> {
    return this.userService.deleteUser(params.id);
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Post(':id/block')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async blockUser(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<UserEntity>> {
    return this.userService.blockUser(params.id);
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Post(':id/balance')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateBalance(
    @Param() params: ParamIdDto,
    @Body() updateBalanceDto: UpdateBalanceDto,
  ): Promise<SingleResponse<UserEntity>> {
    return this.userService.updateBalance(
      params.id,
      updateBalanceDto.amount,
      updateBalanceDto.operation,
    );
  }
}
