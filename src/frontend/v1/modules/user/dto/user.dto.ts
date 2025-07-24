import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  MinLength,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { UserRoleEnum, language } from '../../../../../utils/enum/user.enum';
import { PaginationParams } from '../../../../../utils/dto/dto';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: UserRoleEnum.CLIENT, enum: UserRoleEnum })
  @IsNotEmpty()
  @IsEnum(UserRoleEnum)
  role: UserRoleEnum;

  @ApiProperty({ example: 'password123', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ example: language.UZ, enum: language, required: false })
  @IsOptional()
  @IsEnum(language)
  language?: language;

  @ApiProperty({ example: '+998901234567', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'My Company LLC', required: false })
  @IsOptional()
  @IsString()
  company_name?: string;

  @ApiProperty({ example: 'https://mycompany.com', required: false })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ example: '192.168.1.1,10.0.0.1', required: false })
  @IsOptional()
  @IsString()
  allowed_ips?: string;
}

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'user@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: UserRoleEnum.CLIENT, enum: UserRoleEnum, required: false })
  @IsOptional()
  @IsEnum(UserRoleEnum)
  role?: UserRoleEnum;

  @ApiProperty({ example: 'newpassword123', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ example: language.UZ, enum: language, required: false })
  @IsOptional()
  @IsEnum(language)
  language?: language;

  @ApiProperty({ example: 1000.50, required: false })
  @IsOptional()
  @IsNumber()
  balance?: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  block?: boolean;

  @ApiProperty({ example: '+998901234567', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'My Company LLC', required: false })
  @IsOptional()
  @IsString()
  company_name?: string;

  @ApiProperty({ example: 'https://mycompany.com', required: false })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ example: '192.168.1.1,10.0.0.1', required: false })
  @IsOptional()
  @IsString()
  allowed_ips?: string;
}

export class UpdateBalanceDto {
  @ApiProperty({ example: 100.50 })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'add', enum: ['add', 'subtract'] })
  @IsNotEmpty()
  @IsEnum(['add', 'subtract'])
  operation: 'add' | 'subtract';
}

export class UserQueryDto extends PaginationParams {
  @ApiProperty({ example: UserRoleEnum.CLIENT, enum: UserRoleEnum, required: false })
  @IsOptional()
  @IsEnum(UserRoleEnum)
  role?: UserRoleEnum;

  @ApiProperty({ example: 'john', required: false })
  @IsOptional()
  @IsString()
  search?: string;
}
