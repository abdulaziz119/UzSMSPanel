import {
  IsString,
  IsInt,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SmtpStatusEnum } from '../enum/email-smtp.enum';
import { PaginationParams } from './dto';

export class CreateEmailSmtpDto {
  @ApiProperty({
    description: 'Name of the SMTP configuration',
    example: 'Gmail SMTP',
    maxLength: 255
  })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiProperty({
    description: 'SMTP server host',
    example: 'smtp.gmail.com',
    maxLength: 255
  })
  @IsString()
  @Length(1, 255)
  host: string;

  @ApiProperty({
    description: 'SMTP server port',
    example: 587,
    minimum: 1,
    maximum: 65535
  })
  @IsInt()
  @Min(1)
  @Max(65535)
  port: number;

  @ApiProperty({
    description: 'SMTP username',
    example: 'your-email@gmail.com',
    maxLength: 255
  })
  @IsString()
  @Length(1, 255)
  username: string;

  @ApiProperty({
    description: 'SMTP password',
    example: 'your-app-password',
    maxLength: 255
  })
  @IsString()
  @Length(1, 255)
  password: string;

  @ApiProperty({
    description: 'From email address',
    example: 'noreply@example.com',
    format: 'email'
  })
  @IsEmail()
  from_email: string;

  @ApiPropertyOptional({
    description: 'From name (sender name)',
    example: 'Your Company',
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  from_name?: string;

  @ApiPropertyOptional({
    description: 'Use SSL encryption',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  use_ssl?: boolean;

  @ApiPropertyOptional({
    description: 'Use TLS encryption',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  use_tls?: boolean;

  @ApiPropertyOptional({
    description: 'Daily email sending limit',
    example: 1000,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  daily_limit?: number;
}

export class UpdateEmailSmtpDto {
  @ApiPropertyOptional({
    description: 'Name of the SMTP configuration',
    example: 'Gmail SMTP',
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({
    description: 'SMTP server host',
    example: 'smtp.gmail.com',
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  host?: string;

  @ApiPropertyOptional({
    description: 'SMTP server port',
    example: 587,
    minimum: 1,
    maximum: 65535
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number;

  @ApiPropertyOptional({
    description: 'SMTP username',
    example: 'your-email@gmail.com',
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  username?: string;

  @ApiPropertyOptional({
    description: 'SMTP password',
    example: 'your-app-password',
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  password?: string;

  @ApiPropertyOptional({
    description: 'From email address',
    example: 'noreply@example.com',
    format: 'email'
  })
  @IsOptional()
  @IsEmail()
  from_email?: string;

  @ApiPropertyOptional({
    description: 'From name (sender name)',
    example: 'Your Company',
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  from_name?: string;

  @ApiPropertyOptional({
    description: 'Use SSL encryption',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  use_ssl?: boolean;

  @ApiPropertyOptional({
    description: 'Use TLS encryption',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  use_tls?: boolean;

  @ApiPropertyOptional({
    description: 'SMTP configuration status',
    enum: SmtpStatusEnum,
    example: SmtpStatusEnum.ACTIVE
  })
  @IsOptional()
  @IsEnum(SmtpStatusEnum)
  status?: SmtpStatusEnum;

  @ApiPropertyOptional({
    description: 'Daily email sending limit',
    example: 1000,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  daily_limit?: number;
}

export class EmailSmtpQueryDto extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Filter by SMTP status',
    enum: SmtpStatusEnum,
    example: SmtpStatusEnum.ACTIVE
  })
  @IsOptional()
  @IsEnum(SmtpStatusEnum)
  status?: SmtpStatusEnum;

  @ApiPropertyOptional({
    description: 'Search by name, host, or from_email',
    example: 'gmail'
  })
  @IsOptional()
  @IsString()
  search?: string;
}
