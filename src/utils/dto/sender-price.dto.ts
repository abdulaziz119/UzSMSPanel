import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Length,
  IsDefined,
} from 'class-validator';
import { PaginationParams } from './dto';

export class CreateSenderPriceDto {
  @ApiProperty({
    example: 'BEELINE',
    description: 'Operator kodi',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  operator: string;

  @ApiProperty({
    example: 'Beeline Uzbekistan',
    description: 'Operator nomi',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  operator_name: string;

  @ApiProperty({
    example: 250000,
    description: 'Oylik abon to\'lov',
  })
  @IsNumber()
  @IsNotEmpty()
  monthly_fee: number;

  @ApiPropertyOptional({
    example: 'UZS',
    description: 'Valyuta turi',
    default: 'UZS',
  })
  @IsString()
  @IsOptional()
  @Length(1, 10)
  currency?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Faol holati',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({
    example: 'Operator haqida qo\'shimcha ma\'lumot',
    description: 'Tavsif',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateSenderPriceDto {
  @ApiProperty({ example: 1, description: 'Sender price ID' })
  @IsNumber()
  @IsDefined()
  id: number;

  @ApiPropertyOptional({
    example: 'BEELINE',
    description: 'Operator kodi',
  })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  operator?: string;

  @ApiPropertyOptional({
    example: 'Beeline Uzbekistan',
    description: 'Operator nomi',
  })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  operator_name?: string;

  @ApiPropertyOptional({
    example: 250000,
    description: 'Oylik abon to\'lov',
  })
  @IsNumber()
  @IsOptional()
  monthly_fee?: number;

  @ApiPropertyOptional({
    example: 'UZS',
    description: 'Valyuta turi',
  })
  @IsString()
  @IsOptional()
  @Length(1, 10)
  currency?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Faol holati',
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({
    example: 'Operator haqida qo\'shimcha ma\'lumot',
    description: 'Tavsif',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class SenderPriceFilterDto extends PaginationParams {
  @ApiPropertyOptional({
    example: 'BEELINE',
    description: 'Operator kodi boyicha filter',
  })
  @IsString()
  @IsOptional()
  operator?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Faol holati boyicha filter',
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({
    example: 'beeline',
    description: 'Qidiruv matni (operator yoki operator_name da)',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 100000,
    description: 'Minimal oylik to\'lov',
  })
  @IsNumber()
  @IsOptional()
  price_from?: number;

  @ApiPropertyOptional({
    example: 500000,
    description: 'Maksimal oylik to\'lov',
  })
  @IsNumber()
  @IsOptional()
  price_to?: number;
}
