import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { PaginationParams } from './dto';

export class CreateTariffDto {
  @ApiProperty({ 
    example: "Standart tarif",
    description: "Tarif nomi"
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    example: "Standart mijozlar uchun tarif",
    description: "Tarif tavsifi",
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    example: 100,
    description: "SMS narxi (so'm)"
  })
  @IsNumber()
  @IsNotEmpty()
  sms_price: number;

  @ApiProperty({ 
    example: 500,
    description: "MMS narxi (so'm)",
    required: false
  })
  @IsOptional()
  @IsNumber()
  mms_price?: number;

  @ApiProperty({ 
    example: 1000,
    description: "Voice SMS narxi (so'm)",
    required: false
  })
  @IsOptional()
  @IsNumber()
  voice_price?: number;

  @ApiProperty({ 
    example: 10,
    description: "Chegirma foizi",
    required: false
  })
  @IsOptional()
  @IsNumber()
  discount_percent?: number;

  @ApiProperty({ 
    example: 1000,
    description: "Minimal balans",
    required: false
  })
  @IsOptional()
  @IsNumber()
  min_balance?: number;

  @ApiProperty({ 
    example: 100000,
    description: "Maksimal balans",
    required: false
  })
  @IsOptional()
  @IsNumber()
  max_balance?: number;

  @ApiProperty({ 
    example: true,
    description: "Faol holati",
    required: false
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({ 
    description: "Qo'shimcha sozlamalar",
    required: false
  })
  @IsOptional()
  settings?: any;
}

export class UpdateTariffDto {
  @ApiProperty({ 
    example: 1,
    description: "Tarif ID"
  })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ 
    example: "Yangilangan tarif",
    description: "Tarif nomi",
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ 
    example: "Yangilangan tavsif",
    description: "Tarif tavsifi",
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    example: 120,
    description: "SMS narxi (so'm)",
    required: false
  })
  @IsOptional()
  @IsNumber()
  sms_price?: number;

  @ApiProperty({ 
    example: 600,
    description: "MMS narxi (so'm)",
    required: false
  })
  @IsOptional()
  @IsNumber()
  mms_price?: number;

  @ApiProperty({ 
    example: 1200,
    description: "Voice SMS narxi (so'm)",
    required: false
  })
  @IsOptional()
  @IsNumber()
  voice_price?: number;

  @ApiProperty({ 
    example: 15,
    description: "Chegirma foizi",
    required: false
  })
  @IsOptional()
  @IsNumber()
  discount_percent?: number;

  @ApiProperty({ 
    example: 2000,
    description: "Minimal balans",
    required: false
  })
  @IsOptional()
  @IsNumber()
  min_balance?: number;

  @ApiProperty({ 
    example: 200000,
    description: "Maksimal balans",
    required: false
  })
  @IsOptional()
  @IsNumber()
  max_balance?: number;

  @ApiProperty({ 
    example: false,
    description: "Faol holati",
    required: false
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({ 
    description: "Qo'shimcha sozlamalar",
    required: false
  })
  @IsOptional()
  settings?: any;
}

export class TariffFilterDto extends PaginationParams {
  @ApiProperty({ 
    example: true,
    description: "Faol holatdagilarni ko'rsatish",
    required: false
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({ 
    example: 100,
    description: "Minimal SMS narxi",
    required: false
  })
  @IsOptional()
  @IsNumber()
  min_sms_price?: number;

  @ApiProperty({ 
    example: 200,
    description: "Maksimal SMS narxi",
    required: false
  })
  @IsOptional()
  @IsNumber()
  max_sms_price?: number;

  @ApiProperty({ 
    example: "standart",
    description: "Qidiruv matni",
    required: false
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class AssignTariffDto {
  @ApiProperty({ 
    example: 1,
    description: "Foydalanuvchi ID"
  })
  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @ApiProperty({ 
    example: 2,
    description: "Tarif ID"
  })
  @IsNumber()
  @IsNotEmpty()
  tariff_id: number;

  @ApiProperty({ 
    example: "VIP mijoz uchun",
    description: "Tayinlash sababi",
    required: false
  })
  @IsOptional()
  @IsString()
  reason?: string;
}