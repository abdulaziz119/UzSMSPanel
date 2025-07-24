import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
} from 'class-validator';
import { TariffStatusEnum } from '../../../../../utils/enum/tariff.enum';
import { PaginationParams } from '../../../../../utils/dto/dto';

export class CreateTariffDto {
  @ApiProperty({ example: 'Ucell' })
  @IsNotEmpty()
  @IsString()
  operator: string;

  @ApiProperty({ example: 85.5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price_per_sms: number;

  @ApiProperty({ example: 'UZS', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: TariffStatusEnum.ACTIVE, enum: TariffStatusEnum, required: false })
  @IsOptional()
  @IsEnum(TariffStatusEnum)
  status?: TariffStatusEnum;

  @ApiProperty({ example: 'High quality SMS service', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

export class UpdateTariffDto {
  @ApiProperty({ example: 'Beeline', required: false })
  @IsOptional()
  @IsString()
  operator?: string;

  @ApiProperty({ example: 90.0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price_per_sms?: number;

  @ApiProperty({ example: 'UZS', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: TariffStatusEnum.ACTIVE, enum: TariffStatusEnum, required: false })
  @IsOptional()
  @IsEnum(TariffStatusEnum)
  status?: TariffStatusEnum;

  @ApiProperty({ example: 'Updated description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

export class TariffQueryDto extends PaginationParams {
  @ApiProperty({ example: 'Ucell', required: false })
  @IsOptional()
  @IsString()
  operator?: string;

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  min_price?: number;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_price?: number;

  @ApiProperty({ example: 'UZS', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: TariffStatusEnum.ACTIVE, enum: TariffStatusEnum, required: false })
  @IsOptional()
  @IsEnum(TariffStatusEnum)
  status?: TariffStatusEnum;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

export class CalculatePriceDto {
  @ApiProperty({ example: 'Ucell' })
  @IsNotEmpty()
  @IsString()
  operator: string;

  @ApiProperty({ example: 10 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  sms_count: number;
}
