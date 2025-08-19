import {
  IsEmail,
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  Length,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationParams } from './dto';

export class CreateEmailContactDto {
  @ApiProperty({
    description: 'Email address of the contact',
    example: 'user@example.com',
    format: 'email'
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'First name of the contact',
    example: 'John',
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  first_name?: string;

  @ApiPropertyOptional({
    description: 'Last name of the contact',
    example: 'Doe',
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  last_name?: string;

  @ApiProperty({
    description: 'ID of the email group this contact belongs to',
    example: 1,
    type: 'integer'
  })
  @IsInt()
  email_group_id: number;
}

export class CreateBulkEmailContactDto {
  @ApiProperty({
    description: 'Array of email contacts to create',
    type: [CreateEmailContactDto],
    example: [
      {
        email: 'user1@example.com',
        first_name: 'John',
        last_name: 'Doe',
        email_group_id: 1
      },
      {
        email: 'user2@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        email_group_id: 1
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEmailContactDto)
  contacts: CreateEmailContactDto[];
}

export class UpdateEmailContactDto {
  @ApiPropertyOptional({
    description: 'Email address of the contact',
    example: 'user@example.com',
    format: 'email'
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'First name of the contact',
    example: 'John',
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  first_name?: string;

  @ApiPropertyOptional({
    description: 'Last name of the contact',
    example: 'Doe',
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  last_name?: string;

  @ApiPropertyOptional({
    description: 'Whether the contact is active',
    example: true,
    type: 'boolean'
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'ID of the email group this contact belongs to',
    example: 1,
    type: 'integer'
  })
  @IsOptional()
  @IsInt()
  email_group_id?: number;
}

export class EmailContactQueryDto extends PaginationParams {
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
    description: 'Filter by active status',
    example: true,
    type: 'boolean'
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Search by email, first name, or last name',
    example: 'john'
  })
  @IsOptional()
  @IsString()
  search?: string;
}
