import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmailGroupStatusEnum } from '../enum/email-smtp.enum';
import { PaginationParams } from './dto';

export class CreateEmailGroupDto {
  @ApiProperty({
    description: 'Title of the email group',
    example: 'Newsletter Subscribers',
    maxLength: 255
  })
  @IsString()
  @Length(1, 255)
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the email group',
    example: 'Group for newsletter subscribers',
    maxLength: 1000
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;
}

export class UpdateEmailGroupDto {
  @ApiPropertyOptional({
    description: 'Title of the email group',
    example: 'Newsletter Subscribers',
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Description of the email group',
    example: 'Group for newsletter subscribers',
    maxLength: 1000
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Status of the email group',
    enum: EmailGroupStatusEnum,
    example: EmailGroupStatusEnum.ACTIVE
  })
  @IsOptional()
  @IsEnum(EmailGroupStatusEnum)
  status?: EmailGroupStatusEnum;
}

export class EmailGroupQueryDto extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Filter by email group status',
    enum: EmailGroupStatusEnum,
    example: EmailGroupStatusEnum.ACTIVE
  })
  @IsOptional()
  @IsEnum(EmailGroupStatusEnum)
  status?: EmailGroupStatusEnum;

  @ApiPropertyOptional({
    description: 'Search by title or description',
    example: 'newsletter'
  })
  @IsOptional()
  @IsString()
  search?: string;
}
