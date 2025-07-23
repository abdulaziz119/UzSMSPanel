import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { PaginationParams } from '../../../../../utils/dto/dto';

export class CreateMessageTemplateDto {
  @ApiProperty({ example: 'Welcome Template' })
  @IsNotEmpty()
  @IsString()
  template_name: string;

  @ApiProperty({ example: 'Welcome to our service! Thank you for joining us.' })
  @IsNotEmpty()
  @IsString()
  template_text: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  user_id: number;
}

export class UpdateMessageTemplateDto {
  @ApiProperty({ example: 'Updated Template Name', required: false })
  @IsOptional()
  @IsString()
  template_name?: string;

  @ApiProperty({ example: 'Updated template text content', required: false })
  @IsOptional()
  @IsString()
  template_text?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  is_approved?: boolean;
}

export class MessageTemplateQueryDto extends PaginationParams {
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  is_approved?: boolean;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  user_id?: number;

  @ApiProperty({ example: 'welcome', required: false })
  @IsOptional()
  @IsString()
  search?: string;
}
