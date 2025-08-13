import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsNotEmpty,
  IsBoolean,
} from 'class-validator';
import { UserRoleEnum, language } from '../enum/user.enum';
import { PaginationParams } from './dto';

export interface LocationInterface {
  latitude: number;
  longitude: number;
}

export class UpdateUserProfileDto {
  @ApiProperty({
    example: 'John',
    description: "User's first name",
  })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiProperty({
    example: 'Doe',
    description: "User's last name",
  })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: "User's email address",
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: '998901234567',
    description: "User's phone number",
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: 'uz',
    enum: language,
    description: "User's preferred language",
  })
  @IsOptional()
  @IsEnum(language)
  language?: language;

  @ApiProperty({
    example: { latitude: 41.2995, longitude: 69.2401 },
    description: "User's location coordinates",
  })
  @IsOptional()
  location?: LocationInterface;

  @ApiProperty({
    example: 'My Company LLC',
    description: 'Company name for business users',
  })
  @IsOptional()
  @IsString()
  company_name?: string;

  @ApiProperty({
    example: '123456789',
    description: 'Tax identification number',
  })
  @IsOptional()
  @IsString()
  tin?: string;
}

export class UserFilterDto extends PaginationParams {
  @ApiProperty({
    example: 'john@example.com',
    description: 'Filter by email',
    required: false,
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    example: '998901234567',
    description: 'Filter by phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: 'John',
    description: 'Filter by first name',
    required: false,
  })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Filter by last name',
    required: false,
  })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({
    example: 'My Company',
    description: 'Filter by company name',
    required: false,
  })
  @IsOptional()
  @IsString()
  company_name?: string;

  @ApiProperty({
    example: true,
    description: 'Filter by active status',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({
    example: false,
    description: 'Filter by blocked status',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_blocked?: boolean;

  @ApiProperty({
    example: '2025-01-01',
    description: 'Filter by registration date from',
    required: false,
  })
  @IsOptional()
  @IsString()
  date_from?: string;

  @ApiProperty({
    example: '2025-12-31',
    description: 'Filter by registration date to',
    required: false,
  })
  @IsOptional()
  @IsString()
  date_to?: string;

  @ApiProperty({
    example: 'CLIENT',
    enum: UserRoleEnum,
    description: 'Filter by user role',
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRoleEnum)
  role?: UserRoleEnum;
}

export class UpdateUserBalanceDto {
  @ApiProperty({
    example: 1,
    description: 'User ID to update balance',
  })
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @ApiProperty({
    example: 10000,
    description: 'Amount to add or subtract (in tiyin)',
  })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({
    example: 'ADD',
    description: 'Operation type: ADD or SUBTRACT',
    enum: ['ADD', 'SUBTRACT'],
  })
  @IsNotEmpty()
  @IsString()
  operation: string;

  @ApiProperty({
    example: 'Admin balance adjustment',
    description: 'Reason for balance change',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BlockUserDto {
  @ApiProperty({
    example: 1,
    description: 'User ID to block/unblock',
  })
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @ApiProperty({
    example: 'Violation of terms of service',
    description: 'Reason for blocking the user',
  })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class UserStatsDto {
  @ApiProperty({
    example: '2025-01-01',
    description: 'Start date for statistics',
    required: false,
  })
  @IsOptional()
  @IsString()
  date_from?: string;

  @ApiProperty({
    example: '2025-12-31',
    description: 'End date for statistics',
    required: false,
  })
  @IsOptional()
  @IsString()
  date_to?: string;

  @ApiProperty({
    example: 'CLIENT',
    enum: UserRoleEnum,
    description: 'Filter by user role',
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRoleEnum)
  role?: UserRoleEnum;
}
