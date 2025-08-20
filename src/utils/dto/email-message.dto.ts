import {
  IsEmail,
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  IsEnum,
  IsNotEmpty,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmailStatusEnum } from '../enum/email-smtp.enum';
import { PaginationParams } from './dto';

export class SendEmailDto {
  @ApiPropertyOptional({
    description: 'ID of the email template to use',
    example: 1,
    type: 'integer'
  })
  @IsNotEmpty()
  @IsInt()
  email_template_id: number;

  @ApiPropertyOptional({
    description: 'ID of the email group to send to',
    example: 1,
    type: 'integer'
  })
  @IsOptional()
  @IsInt()
  group_id?: number;

  @ApiPropertyOptional({
    description: 'ID of the SMTP configuration to use',
    example: 1,
    type: 'integer'
  })
  @IsOptional()
  @IsInt()
  email_smtp_id?: number;

  @ApiPropertyOptional({
    description: 'List of recipient email addresses',
    example: ['user1@example.com', 'user2@example.com'],
    type: [String],
    format: 'email'
  })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  recipient_emails?: string[];
}

export class EmailMessageQueryDto extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Filter by email status',
    enum: EmailStatusEnum,
    example: EmailStatusEnum.SENT
  })
  @IsOptional()
  @IsEnum(EmailStatusEnum)
  status?: EmailStatusEnum;

  @ApiPropertyOptional({
    description: 'Filter by email group ID',
    example: 1,
    type: 'integer'
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  group_id?: number;

  @ApiPropertyOptional({
    description: 'Filter by email template ID',
    example: 1,
    type: 'integer'
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  email_template_id?: number;

  @ApiPropertyOptional({
    description: 'Search by subject or recipient email',
    example: 'welcome'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter emails from this date (YYYY-MM-DD)',
    example: '2024-01-01'
  })
  @IsOptional()
  @IsString()
  date_from?: string;

  @ApiPropertyOptional({
    description: 'Filter emails to this date (YYYY-MM-DD)',
    example: '2024-12-31'
  })
  @IsOptional()
  @IsString()
  date_to?: string;
}
