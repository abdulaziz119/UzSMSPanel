import { PaginationParams } from '../dto/dto';
import { BalanceOperationEnum, UserRoleEnum } from '../enum/user.enum';

export interface UserFilterDto extends PaginationParams {
  role?: UserRoleEnum;
  blocked?: boolean;
  search?: string;
}
