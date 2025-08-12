import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateSmsGroupDto {
  @ApiProperty({ example: 'My SMS Group', description: 'SMS group title' })
  @IsString()
  @IsNotEmpty()
  title: string;
}

export class UpdateSmsGroupDto {
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
