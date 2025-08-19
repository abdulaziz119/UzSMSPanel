import {
  IsEmail,
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  IsEnum,
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
  @IsOptional()
  @IsInt()
  email_template_id?: number;

  @ApiPropertyOptional({
    description: 'ID of the email group to send to',
    example: 1,
    type: 'integer'
  })
  @IsOptional()
  @IsInt()
  email_group_id?: number;

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

  @ApiPropertyOptional({
    description: 'Subject of the email',
    example: 'Welcome to our service!',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  subject?: string;

  @ApiPropertyOptional({
    description: 'HTML content of the email',
    example: '<h1>Welcome!</h1><p>Thank you for joining us.</p>'
  })
  @IsOptional()
  @IsString()
  html_content?: string;

  @ApiPropertyOptional({
    description: 'Plain text content of the email',
    example: 'Welcome! Thank you for joining us.'
  })
  @IsOptional()
  @IsString()
  text_content?: string;
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
  email_group_id?: number;

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
