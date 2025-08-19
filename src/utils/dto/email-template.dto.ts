import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsObject,
  IsArray,
  IsBoolean,
  IsUrl,
  ValidateNested,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmailTemplateStatusEnum } from '../enum/email-smtp.enum';
import { PaginationParams } from './dto';

class AttachmentDto {
  @ApiProperty({
    description: 'Name of the attachment file',
    example: 'document.pdf'
  })
  @IsString()
  filename: string;

  @ApiProperty({
    description: 'Path to the attachment file',
    example: '/uploads/documents/document.pdf'
  })
  @IsString()
  path: string;

  @ApiProperty({
    description: 'MIME type of the attachment',
    example: 'application/pdf'
  })
  @IsString()
  contentType: string;

  @ApiProperty({
    description: 'Size of the attachment in bytes',
    example: 1024000
  })
  @IsInt()
  size: number;
}

class ImageDto {
  @ApiProperty({
    description: 'Name of the image file',
    example: 'logo.png'
  })
  @IsString()
  filename: string;

  @ApiProperty({
    description: 'Path to the image file',
    example: '/uploads/images/logo.png'
  })
  @IsString()
  path: string;

  @ApiProperty({
    description: 'Content ID for embedding in email',
    example: 'logo_123'
  })
  @IsString()
  cid: string;

  @ApiPropertyOptional({
    description: 'Alternative text for the image',
    example: 'Company Logo'
  })
  @IsOptional()
  @IsString()
  alt_text?: string;
}

class DesignSettingsDto {
  @ApiPropertyOptional({
    description: 'Background color of the email template',
    example: '#ffffff'
  })
  @IsOptional()
  @IsString()
  background_color?: string;

  @ApiPropertyOptional({
    description: 'Text color of the email template',
    example: '#333333'
  })
  @IsOptional()
  @IsString()
  text_color?: string;

  @ApiPropertyOptional({
    description: 'Font family for the email template',
    example: 'Arial, sans-serif'
  })
  @IsOptional()
  @IsString()
  font_family?: string;

  @ApiPropertyOptional({
    description: 'Font size for the email template',
    example: '14px'
  })
  @IsOptional()
  @IsString()
  font_size?: string;

  @ApiPropertyOptional({
    description: 'Button background color',
    example: '#007bff'
  })
  @IsOptional()
  @IsString()
  button_color?: string;

  @ApiPropertyOptional({
    description: 'Button text color',
    example: '#ffffff'
  })
  @IsOptional()
  @IsString()
  button_text_color?: string;

  @ApiPropertyOptional({
    description: 'URL to the logo image',
    example: 'https://example.com/logo.png'
  })
  @IsOptional()
  @IsUrl()
  logo_url?: string;

  @ApiPropertyOptional({
    description: 'Header image for the email',
    example: 'header_image.jpg'
  })
  @IsOptional()
  @IsString()
  header_image?: string;

  @ApiPropertyOptional({
    description: 'Footer text for the email',
    example: '© 2024 Your Company. All rights reserved.'
  })
  @IsOptional()
  @IsString()
  footer_text?: string;
}

export class CreateEmailTemplateDto {
  @ApiProperty({
    description: 'Name of the email template',
    example: 'Welcome Email Template',
    maxLength: 200
  })
  @IsString()
  @Length(1, 200)
  name: string;

  @ApiProperty({
    description: 'Subject line of the email',
    example: 'Welcome to our service!',
    maxLength: 500
  })
  @IsString()
  @Length(1, 500)
  subject: string;

  @ApiProperty({
    description: 'HTML content of the email template',
    example: '<h1>Welcome {{name}}!</h1><p>Thank you for joining us.</p>'
  })
  @IsString()
  html_content: string;

  @ApiPropertyOptional({
    description: 'Plain text version of the email content',
    example: 'Welcome {{name}}! Thank you for joining us.'
  })
  @IsOptional()
  @IsString()
  text_content?: string;

  @ApiPropertyOptional({
    description: 'Variables used in the template',
    example: { name: 'string', email: 'string', company: 'string' }
  })
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Attachments for the email template',
    type: [AttachmentDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  @ApiPropertyOptional({
    description: 'Images used in the email template',
    type: [ImageDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  images?: ImageDto[];

  @ApiPropertyOptional({
    description: 'Type of the email template',
    example: 'newsletter'
  })
  @IsOptional()
  @IsString()
  template_type?: string;

  @ApiPropertyOptional({
    description: 'Design settings for the email template',
    type: DesignSettingsDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DesignSettingsDto)
  design_settings?: DesignSettingsDto;

  @ApiPropertyOptional({
    description: 'Whether the template is responsive',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  is_responsive?: boolean;

  @ApiPropertyOptional({
    description: 'Custom CSS styles for the template'
  })
  @IsOptional()
  @IsString()
  css_styles?: string;

  @ApiPropertyOptional({
    description: 'Preview text shown in email clients',
    example: 'Welcome to our service - get started today!',
    maxLength: 150
  })
  @IsOptional()
  @IsString()
  @Length(0, 150)
  preview_text?: string;

  @ApiPropertyOptional({
    description: 'ID of the uploaded file associated with this template',
    example: 1
  })
  @IsOptional()
  @IsInt()
  file_id?: number;

  @ApiPropertyOptional({
    description: 'Description of the email template',
    example: 'Welcome email sent to new users'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Data from email builder',
    example: { blocks: [], structure: {} }
  })
  @IsOptional()
  @IsObject()
  builder_data?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Style configurations',
    example: { theme: 'modern', colors: {} }
  })
  @IsOptional()
  @IsObject()
  styles?: Record<string, any>;
}

export class UpdateEmailTemplateDto {
  @ApiPropertyOptional({
    description: 'Name of the email template',
    example: 'Welcome Email Template',
    maxLength: 200
  })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  name?: string;

  @ApiPropertyOptional({
    description: 'Subject line of the email',
    example: 'Welcome to our service!',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  subject?: string;

  @ApiPropertyOptional({
    description: 'HTML content of the email template',
    example: '<h1>Welcome {{name}}!</h1><p>Thank you for joining us.</p>'
  })
  @IsOptional()
  @IsString()
  html_content?: string;

  @ApiPropertyOptional({
    description: 'Plain text version of the email content',
    example: 'Welcome {{name}}! Thank you for joining us.'
  })
  @IsOptional()
  @IsString()
  text_content?: string;

  @ApiPropertyOptional({
    description: 'Status of the email template',
    enum: EmailTemplateStatusEnum,
    example: EmailTemplateStatusEnum.ACTIVE
  })
  @IsOptional()
  @IsEnum(EmailTemplateStatusEnum)
  status?: EmailTemplateStatusEnum;

  @ApiPropertyOptional({
    description: 'Variables used in the template',
    example: { name: 'string', email: 'string', company: 'string' }
  })
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Attachments for the email template',
    type: [AttachmentDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  @ApiPropertyOptional({
    description: 'Images used in the email template',
    type: [ImageDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  images?: ImageDto[];

  @ApiPropertyOptional({
    description: 'Type of the email template',
    example: 'newsletter'
  })
  @IsOptional()
  @IsString()
  template_type?: string;

  @ApiPropertyOptional({
    description: 'Design settings for the email template',
    type: DesignSettingsDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DesignSettingsDto)
  design_settings?: DesignSettingsDto;

  @ApiPropertyOptional({
    description: 'Whether the template is responsive',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  is_responsive?: boolean;

  @ApiPropertyOptional({
    description: 'Custom CSS styles for the template'
  })
  @IsOptional()
  @IsString()
  css_styles?: string;

  @ApiPropertyOptional({
    description: 'Preview text shown in email clients',
    example: 'Welcome to our service - get started today!',
    maxLength: 150
  })
  @IsOptional()
  @IsString()
  @Length(0, 150)
  preview_text?: string;

  @ApiPropertyOptional({
    description: 'ID of the uploaded file associated with this template',
    example: 1
  })
  @IsOptional()
  @IsInt()
  file_id?: number;

  @ApiPropertyOptional({
    description: 'Description of the email template',
    example: 'Welcome email sent to new users'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Data from email builder',
    example: { blocks: [], structure: {} }
  })
  @IsOptional()
  @IsObject()
  builder_data?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Style configurations',
    example: { theme: 'modern', colors: {} }
  })
  @IsOptional()
  @IsObject()
  styles?: Record<string, any>;
}

export class EmailTemplateQueryDto extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Filter by email template status',
    enum: EmailTemplateStatusEnum,
    example: EmailTemplateStatusEnum.ACTIVE
  })
  @IsOptional()
  @IsEnum(EmailTemplateStatusEnum)
  status?: EmailTemplateStatusEnum;

  @ApiPropertyOptional({
    description: 'Search by template name, subject, or description',
    example: 'welcome'
  })
  @IsOptional()
  @IsString()
  search?: string;
}
