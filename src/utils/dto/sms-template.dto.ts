import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  IsEnum,
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
}

export class UpdateSmsTemplateDto {
  @ApiProperty({ example: 1 })
  @IsDefined()
  @IsNumber()
  id: number;

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
  rejection_reason?: string;
}
