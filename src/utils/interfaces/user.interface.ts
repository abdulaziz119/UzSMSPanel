import { language, UserRoleEnum } from '../enum/user.enum';

export interface CreateUserDto {
  name?: string;
  email: string;
  role: UserRoleEnum;
  password?: string;
  language?: language;
  phone?: string;
  company_name?: string;
  website?: string;
  allowed_ips?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: UserRoleEnum;
  password?: string;
  language?: language;
  balance?: number;
  block?: boolean;
  phone?: string;
  company_name?: string;
  website?: string;
  allowed_ips?: string;
  last_login_at?: Date;
  last_login_ip?: string;
}
