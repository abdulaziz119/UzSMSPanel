import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Length,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SMSContactStatusEnum } from '../enum/sms-contact.enum';
import { PaginationParams } from './dto';

export class CreateSmsContactDto {
  @ApiProperty({ example: 'John Doe', description: 'SMS contact name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: '998901234567',
    description:
      'Phone number (max 20 characters) - Status will be determined automatically by backend',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  phone: string;

  @ApiProperty({ example: 1, description: 'SMS group ID' })
  @IsNumber()
  @IsNotEmpty()
  group_id: number;
}

export class BulkCreateSmsContactDto {
  @ApiProperty({
    type: [CreateSmsContactDto],
    description: 'Array of SMS contacts to create',
    example: [
      {
        name: 'John Doe',
        phone: '998901234567',
        group_id: 1
      },
      {
        name: 'Jane Smith',
        phone: '998907654321',
        group_id: 1
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSmsContactDto)
  contacts: CreateSmsContactDto[];
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
    enum: SMSContactStatusEnum,
    example: SMSContactStatusEnum.ACTIVE,
    description:
      'Contact status: approved (tasdiqlangan), invalid_format (hech bir davlatga tegishli bolmagani), banned_number (taqiqlangan raqamlar)',
  })
  @IsEnum(SMSContactStatusEnum)
  @IsOptional()
  status?: SMSContactStatusEnum;

  @ApiPropertyOptional({
    example: '998901234567',
    description: 'Phone number (max 20 characters)',
    maxLength: 20,
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

export class SmsContactFindAllDto extends PaginationParams {
  @ApiPropertyOptional({ example: '99890', description: 'Filter by phone (partial is ok)' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ enum: SMSContactStatusEnum, example: SMSContactStatusEnum.ACTIVE })
  @IsEnum(SMSContactStatusEnum)
  @IsOptional()
  status?: SMSContactStatusEnum;

  @ApiPropertyOptional({ example: 'John', description: 'Filter by name (partial match)' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 1, description: 'Filter by group ID' })
  @IsNumber()
  @IsOptional()
  group_id?: number;
}
