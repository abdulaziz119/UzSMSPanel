import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
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
}
