import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  IsEnum,
  IsArray,
  IsNumber,
} from 'class-validator';
import { TemplateStatusEnum } from '../enum/sms-template.enum';

export class CreateSmsTemplateDto {
  @ApiProperty({ example: 'Welcome Template', description: 'Template name' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  name: string;

  @ApiProperty({
    example: 'Assalomu alaykum {name}! Bizning xizmatimizga xush kelibsiz!',
    description: 'Template content with variables',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    example: 'UzSMS',
    description: 'SMS sender name',
  })
  @IsString()
  @IsOptional()
  @Length(1, 20)
  sender?: string;

  @ApiPropertyOptional({
    example: 'Welcome message template for new users',
    description: 'Template description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: ['name', 'phone', 'code'],
    description: 'Template variables list',
  })
  @IsArray()
  @IsOptional()
  variables?: string[];
}

export class UpdateSmsTemplateDto {
  @ApiProperty({ example: 1 })
  @IsDefined()
  @IsNumber()
  id: number;

  @ApiPropertyOptional({
    example: 'Updated Template Name',
    description: 'Template name',
  })
  @IsString()
  @IsOptional()
  @Length(1, 200)
  name?: string;

  @ApiPropertyOptional({
    example: 'Updated content {name}!',
    description: 'Template content',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    example: 'UzSMS',
    description: 'SMS sender name',
  })
  @IsString()
  @IsOptional()
  @Length(1, 20)
  sender?: string;

  @ApiPropertyOptional({
    enum: TemplateStatusEnum,
    description: 'Template status',
  })
  @IsEnum(TemplateStatusEnum)
  @IsOptional()
  status?: TemplateStatusEnum;

  @ApiPropertyOptional({
    example: 'Updated description',
    description: 'Template description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: ['name', 'phone'],
    description: 'Template variables list',
  })
  @IsArray()
  @IsOptional()
  variables?: string[];
}
