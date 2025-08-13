import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SingleResponse, ParamIdDto } from '../../../../utils/dto/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { 
  UserService
} from '../../../../service/user.service';
import { UserEntity } from '../../../../entity/user.entity';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { 
  UserFilterDto,
  UpdateUserBalanceDto,
  BlockUserDto 
} from '../../../../utils/dto/user.dto';

@ApiBearerAuth()
@ApiTags('dashboard-user')
@Controller({ path: '/dashboard/user', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Foydalanuvchilar ro'yxati (adminlar uchun, filter + pagination)
   */
  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async findAllUsers(
    @Body() filters: UserFilterDto,
  ): Promise<PaginationResponse<UserEntity[]>> {
    return await this.userService.findAllUsers(filters);
  }

  /**
   * Foydalanuvchi tafsilotlari (ID bo'yicha)
   */
  @Post('/details')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getUserDetails(
    @Body() param: ParamIdDto,
  ): Promise<SingleResponse<UserEntity>> {
    return await this.userService.getUserDetails(param.id);
  }

  /**
   * Foydalanuvchini bloklash
   */
  @Post('/block')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async blockUser(
    @Body() body: BlockUserDto,
  ): Promise<SingleResponse<{ message: string }>> {
    return await this.userService.blockUser(body);
  }

  /**
   * Foydalanuvchini blokdan chiqarish
   */
  @Post('/unblock')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async unblockUser(
    @Body() body: BlockUserDto,
  ): Promise<SingleResponse<{ message: string }>> {
    return await this.userService.unblockUser(body);
  }

  /**
   * Foydalanuvchi balansini yangilash (admin tomondan)
   */
  @Post('/update-balance')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async updateUserBalance(
    @Body() body: UpdateUserBalanceDto,
  ): Promise<SingleResponse<{ new_balance: number }>> {
    return await this.userService.updateUserBalance(body);
  }

  /**
   * Umumiy foydalanuvchi statistikasi (admin paneli uchun)
   */
  @Post('/statistics')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getUserStatistics(): Promise<SingleResponse<any>> {
    return await this.userService.getUserStatistics();
  }
}
