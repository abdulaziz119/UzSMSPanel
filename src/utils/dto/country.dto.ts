import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDefined,
  IsNumber,
  Length,
  Matches,
} from 'class-validator';
import { PaginationParams } from './dto';

export class CreateCountryDto {
  @ApiProperty({ 
    example: 'Uzbekistan',
    description: 'Country name',
  })
  @IsString()
  @IsDefined()
  name: string;

  @ApiProperty({ 
    example: 'UZB',
    description: 'ISO 3166-1 alpha-3 country code',
  })
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, { message: 'Code must be 3 uppercase letters' })
  @IsDefined()
  code: string;

  @ApiProperty({ 
    example: 'UZ',
    description: 'ISO 3166-1 alpha-2 country code',
  })
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/, { message: 'ISO code must be 2 uppercase letters' })
  @IsDefined()
  iso_code: string;

  @ApiPropertyOptional({ 
    example: '+998',
    description: 'International dialing code',
  })
  @IsString()
  @IsOptional()
  phone_code?: string;

  @ApiPropertyOptional({ 
    example: 'UZS',
    description: 'Currency code',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ 
    example: true,
    description: 'Is country active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdateCountryDto extends CreateCountryDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsDefined()
  id: number;
}

export class CountryFilterDto extends PaginationParams {
  @ApiPropertyOptional({
    example: 'Uzbekistan',
    description: 'Search by country name, code, or ISO code',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by active status',
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
