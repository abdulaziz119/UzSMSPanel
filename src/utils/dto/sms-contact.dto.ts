import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Length,
} from 'class-validator';

export class CreateSmsContactDto {
  @ApiProperty({ example: 'John Doe', description: 'SMS contact name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    example: '998901234567', 
    description: 'Phone number (max 20 characters)',
    maxLength: 20
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  phone: string;

  @ApiPropertyOptional({ example: 'Family Group', description: 'Group name' })
  @IsString()
  @IsOptional()
  group_name?: string;

  @ApiProperty({ example: 1, description: 'SMS group ID' })
  @IsNumber()
  @IsNotEmpty()
  group_id: number;
}

export class UpdateSmsContactDto {
  @ApiProperty({ example: 1, description: 'SMS contact ID' })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiPropertyOptional({ example: 'John Doe', description: 'SMS contact name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ 
    example: '998901234567', 
    description: 'Phone number (max 20 characters)',
    maxLength: 20
  })
  @IsString()
  @IsOptional()
  @Length(1, 20)
  phone?: string;

  @ApiPropertyOptional({ example: 'Family Group', description: 'Group name' })
  @IsString()
  @IsOptional()
  group_name?: string;

  @ApiPropertyOptional({ example: 1, description: 'SMS group ID' })
  @IsNumber()
  @IsOptional()
  group_id?: number;
}
