import { PaginationParams } from '../dto/dto';
import { BalanceOperationEnum, UserRoleEnum } from '../enum/user.enum';

export interface UserFilterDto extends PaginationParams {
  role?: UserRoleEnum;
  blocked?: boolean;
  search?: string;
}

export interface UpdateUserBalanceDto {
  user_id: number;
  amount: number;
  operation: BalanceOperationEnum;
  description?: string;
}

export interface BlockUserDto {
  user_id: number;
  reason?: string;
}
