import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsIn,
  IsEnum,
} from 'class-validator';
import { PaginationParams } from './dto';
import { TariffType } from '../enum/tariff.enum';

export class CreateTariffDto {
  @ApiProperty({
    example: '90',
    description: 'Operator kod (prefix) yoki umumiy kod',
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    example: 'Beeline 90',
    description: 'Tarif nomi',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: '99890',
    description: 'Telefon prefiksi (phone_ext)',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone_ext?: string;

  @ApiProperty({
    example: 80.25,
    description: 'Provider tan narhi (cost_price)',
  })
  @IsNumber()
  @IsNotEmpty()
  price_provider_sms: number;

  @ApiProperty({
    example: 10,
    description: 'Foyiz (%) - provider narxiga qanchalik foyiz qo`shish',
  })
  @IsOptional()
  @IsNumber()
  margin_percent?: number;

  // Tan narx endi SmsPrice jadvalida boshqariladi

  @ApiProperty({ example: 'BEELINE', description: 'Operator nomi' })
  @IsString()
  @IsNotEmpty()
  operator: string;

  @ApiProperty({
    example: true,
    description: 'Ommaviy (public) holati',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  public?: boolean;

  @ApiProperty({ example: 1, description: 'Davlat ID' })
  @IsNumber()
  @IsNotEmpty()
  country_id: number;

  @ApiProperty({
    example: TariffType.SMS,
    description: 'Tarif turi - SMS yoki EMAIL',
    enum: TariffType,
    default: TariffType.SMS,
  })
  @IsOptional()
  @IsEnum(TariffType)
  type?: TariffType;
}

export class UpdateTariffDto {
  @ApiProperty({ example: 1, description: 'Tarif ID' })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ example: '99890', description: 'Kod', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    example: 'Beeline 90',
    description: 'Tarif nomi',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: '99890',
    description: 'Telefon prefiksi',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone_ext?: string;

  @ApiProperty({
    example: 'BEELINE',
    description: 'Operator nomi',
    required: false,
  })
  @IsOptional()
  @IsString()
  operator?: string;

  @ApiProperty({ example: true, description: 'Public holati', required: false })
  @IsOptional()
  @IsBoolean()
  public?: boolean;

  @ApiProperty({ example: 1, description: 'Davlat ID', required: false })
  @IsOptional()
  @IsNumber()
  country_id?: number;

  @ApiProperty({
    example: TariffType.SMS,
    description: 'Tarif turi - SMS yoki EMAIL',
    enum: TariffType,
    required: false,
  })
  @IsOptional()
  @IsEnum(TariffType)
  type?: TariffType;
}

export class TariffFilterDto extends PaginationParams {
  @ApiProperty({ example: 'BEELINE', description: 'Operator', required: false })
  @IsOptional()
  @IsString()
  operator?: string;

  @ApiProperty({
    example: '99890',
    description: 'Telefon prefiksi',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone_ext?: string;

  @ApiProperty({ example: true, description: 'Public holati', required: false })
  @IsOptional()
  @IsBoolean()
  public?: boolean;

  @ApiProperty({ example: 100, description: 'Minimal narx', required: false })
  @IsOptional()
  @IsNumber()
  price_from?: number;

  @ApiProperty({ example: 200, description: 'Maksimal narx', required: false })
  @IsOptional()
  @IsNumber()
  price_to?: number;

  @ApiProperty({
    example: 'beeline',
    description: 'Qidiruv matni',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    example: 1,
    description: 'Davlat ID boyicha filter',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  country_id?: number;

  @ApiProperty({
    example: TariffType.SMS,
    description: 'Tarif turi boyicha filter - SMS yoki EMAIL',
    enum: TariffType,
    required: false,
  })
  @IsOptional()
  @IsEnum(TariffType)
  type?: TariffType;
}

export class BulkUpdateTariffPricesDto {
  @ApiProperty({ example: 1, description: 'Tarif ID' })
  @IsNumber()
  @IsNotEmpty()
  id: number;
  // @ApiProperty({ example: 'BEELINE', description: 'Operator nomi' })
  // @IsString()
  // @IsNotEmpty()
  // operator: string;

  @ApiProperty({
    example: 10,
    description: 'Ozgartirish qiymati (foiz yoki fixed)',
  })
  @IsNumber()
  @IsNotEmpty()
  price_adjustment: number;

  @ApiProperty({ example: 'percent', enum: ['percent', 'fixed'] })
  @IsString()
  @IsIn(['percent', 'fixed'])
  adjustment_type: 'percent' | 'fixed';
}
