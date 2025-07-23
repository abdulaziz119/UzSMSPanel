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
import {
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiBadRequestResponse,
  ApiOperation,
} from '@nestjs/swagger';
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

  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Post()
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<SingleResponse<UserEntity>> {
    return this.userService.createUser(createUserDto);
  }

  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @Get()
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
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

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Get(':id')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  async getUserById(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<UserEntity>> {
    return this.userService.getUserById(params.id);
  }

  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Put(':id')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  async updateUser(
    @Param() params: ParamIdDto,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<SingleResponse<UserEntity>> {
    return this.userService.updateUser(params.id, updateUserDto);
  }

  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Delete(':id')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN)
  async deleteUser(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<{ message: string }>> {
    return this.userService.deleteUser(params.id);
  }

  @ApiOperation({ summary: 'Block/Unblock user' })
  @ApiResponse({ status: 200, description: 'User block status updated successfully' })
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

  @ApiOperation({ summary: 'Update user balance' })
  @ApiResponse({ status: 200, description: 'User balance updated successfully' })
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
