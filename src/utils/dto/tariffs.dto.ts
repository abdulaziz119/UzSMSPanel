import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { PaginationParams } from './dto';

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

  @ApiProperty({ example: 100.5, description: 'SMS narxi' })
  @IsNumber()
  @IsNotEmpty()
  price: number;

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

  @ApiProperty({ example: 120, description: 'SMS narxi', required: false })
  @IsOptional()
  @IsNumber()
  price?: number;

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
}
