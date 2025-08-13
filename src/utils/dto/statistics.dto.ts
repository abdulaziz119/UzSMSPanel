import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { OperatorEnum } from '../enum/sms-price.enum';

export class DashboardStatsFilterDto {
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
    example: "day",
    enum: ["day", "week", "month"],
    description: "Guruhlash turi",
    required: false
  })
  @IsOptional()
  @IsString()
  group_by?: 'day' | 'week' | 'month';
}

export class SmsReportsFilterDto {
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
    example: "BEELINE",
    enum: OperatorEnum,
    description: "Operator",
    required: false
  })
  @IsOptional()
  @IsEnum(OperatorEnum)
  operator?: OperatorEnum;

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

export class RevenueReportsFilterDto {
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
    example: "month",
    enum: ["day", "week", "month"],
    description: "Davrlar bo'yicha",
    required: false
  })
  @IsOptional()
  @IsString()
  period?: 'day' | 'week' | 'month';
}

export class UserAnalyticsFilterDto {
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
    example: "week",
    enum: ["day", "week", "month"],
    description: "Tahlil davri",
    required: false
  })
  @IsOptional()
  @IsString()
  period?: 'day' | 'week' | 'month';
}