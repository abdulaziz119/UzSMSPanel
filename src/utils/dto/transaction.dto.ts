import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { TransactionTypeEnum, TransactionStatusEnum, PaymentMethodEnum } from '../enum/transaction.enum';
import { PaginationParams } from './dto';

export class TopUpBalanceDto {
  @ApiProperty({ 
    example: 50000,
    description: "To'ldiriladigan summa"
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ 
    example: "CLICK",
    enum: PaymentMethodEnum,
    description: "To'lov usuli"
  })
  @IsEnum(PaymentMethodEnum)
  payment_method: PaymentMethodEnum;

  @ApiProperty({ 
    example: "Balansni to'ldirish",
    description: "To'lov tavsifi",
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class TransactionFilterDto extends PaginationParams {
  @ApiProperty({ 
    example: "2025-08-01",
    description: "Boshlanish sanasi",
    required: false
  })
  @IsOptional()
  @IsString()
  date_from?: string;

  @ApiProperty({ 
    example: "2025-08-31",
    description: "Tugash sanasi",
    required: false
  })
  @IsOptional()
  @IsString()
  date_to?: string;

  @ApiProperty({ 
    example: "DEPOSIT",
    enum: TransactionTypeEnum,
    description: "Tranzaksiya turi",
    required: false
  })
  @IsOptional()
  @IsEnum(TransactionTypeEnum)
  type?: TransactionTypeEnum;

  @ApiProperty({ 
    example: "COMPLETED",
    enum: TransactionStatusEnum,
    description: "Tranzaksiya holati",
    required: false
  })
  @IsOptional()
  @IsEnum(TransactionStatusEnum)
  status?: TransactionStatusEnum;

  @ApiProperty({ 
    example: 1,
    description: "Foydalanuvchi ID",
    required: false
  })
  @IsOptional()
  @IsNumber()
  user_id?: number;

  @ApiProperty({ 
    example: "CLICK",
    enum: PaymentMethodEnum,
    description: "To'lov usuli",
    required: false
  })
  @IsOptional()
  @IsEnum(PaymentMethodEnum)
  payment_method?: PaymentMethodEnum;

  @ApiProperty({ 
    example: "to'ldirish",
    description: "Qidiruv matni",
    required: false
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class TransactionStatsDto {
  @ApiProperty({ 
    example: "2025-08-01",
    description: "Boshlanish sanasi",
    required: false
  })
  @IsOptional()
  @IsString()
  date_from?: string;

  @ApiProperty({ 
    example: "2025-08-31",
    description: "Tugash sanasi",
    required: false
  })
  @IsOptional()
  @IsString()
  date_to?: string;

  @ApiProperty({ 
    example: 1,
    description: "Foydalanuvchi ID",
    required: false
  })
  @IsOptional()
  @IsNumber()
  user_id?: number;

  @ApiProperty({ 
    example: "DEPOSIT",
    enum: TransactionTypeEnum,
    description: "Tranzaksiya turi",
    required: false
  })
  @IsOptional()
  @IsEnum(TransactionTypeEnum)
  type?: TransactionTypeEnum;

  @ApiProperty({ 
    example: "CLICK",
    enum: PaymentMethodEnum,
    description: "To'lov usuli",
    required: false
  })
  @IsOptional()
  @IsEnum(PaymentMethodEnum)
  payment_method?: PaymentMethodEnum;

  @ApiProperty({ 
    example: "day",
    enum: ["day", "week", "month"],
    description: "Guruhlash turi",
    required: false
  })
  @IsOptional()
  @IsString()
  group_by?: 'day' | 'week' | 'month';
}

export class AdminTopUpDto {
  @ApiProperty({ 
    example: 1,
    description: "Foydalanuvchi ID"
  })
  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @ApiProperty({ 
    example: 10000,
    description: "Qo'shiladigan summa"
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ 
    example: "Bonus qo'shish",
    description: "Tavsif",
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    example: "Admin tomonidan bonus",
    description: "Admin izohi",
    required: false
  })
  @IsOptional()
  @IsString()
  admin_note?: string;
}