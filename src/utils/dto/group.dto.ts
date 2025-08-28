import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  IsNumber,
  IsDateString,
} from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 'My SMS Group', description: 'SMS group title' })
  @IsString()
  @IsNotEmpty()
  title: string;
}

export class UpdateGroupDto {
  @ApiProperty({ example: 1 })
  @IsDefined()
  id: number;

  @ApiPropertyOptional({
    example: 'Updated SMS Group',
    description: 'SMS group title',
  })
  @IsString()
  @IsOptional()
  title?: string;
}

export class GroupFilterDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  user_id?: number;

  @ApiPropertyOptional({ example: 'marketing' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
