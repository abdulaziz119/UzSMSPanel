import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';

export class DashboardStatsFilterDto {
  @ApiProperty({
    example: '2025-08-01',
    description: 'Boshlanish sanasi',
    required: false,
  })
  @IsOptional()
  @IsString()
  date_from?: string;

  @ApiProperty({
    example: '2025-08-31',
    description: 'Tugash sanasi',
    required: false,
  })
  @IsOptional()
  @IsString()
  date_to?: string;

  @ApiProperty({
    example: 'day',
    enum: ['day', 'week', 'month'],
    description: 'Guruhlash turi',
    required: false,
  })
  @IsOptional()
  @IsString()
  group_by?: 'day' | 'week' | 'month';

  @ApiProperty({
    example: 'week',
    enum: ['day', 'week', 'month', 'year'],
    description: "Davr bo'yicha tezkor filter",
    required: false,
  })
  @IsOptional()
  @IsString()
  period?: 'day' | 'week' | 'month' | 'year';
}

export class SmsReportsFilterDto {
  @ApiProperty({
    example: '2025-08-01',
    description: 'Boshlanish sanasi',
    required: false,
  })
  @IsOptional()
  @IsString()
  date_from?: string;

  @ApiProperty({
    example: '2025-08-31',
    description: 'Tugash sanasi',
    required: false,
  })
  @IsOptional()
  @IsString()
  date_to?: string;

  @ApiProperty({
    example: 1,
    description: 'Foydalanuvchi ID',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  user_id?: number;

  @ApiProperty({
    example: 'BEELINE',
    required: false,
  })
  @IsOptional()
  operator?: string;

  @ApiProperty({
    example: 'day',
    enum: ['day', 'week', 'month'],
    description: 'Guruhlash turi',
    required: false,
  })
  @IsOptional()
  @IsString()
  group_by?: 'day' | 'week' | 'month';
}

export class RevenueReportsFilterDto {
  @ApiProperty({
    example: '2025-08-01',
    description: 'Boshlanish sanasi',
    required: false,
  })
  @IsOptional()
  @IsString()
  date_from?: string;

  @ApiProperty({
    example: '2025-08-31',
    description: 'Tugash sanasi',
    required: false,
  })
  @IsOptional()
  @IsString()
  date_to?: string;

  @ApiProperty({
    example: 'month',
    enum: ['day', 'week', 'month'],
    description: "Davrlar bo'yicha",
    required: false,
  })
  @IsOptional()
  @IsString()
  period?: 'day' | 'week' | 'month';
}

export class UserAnalyticsFilterDto {
  @ApiProperty({
    example: '2025-08-01',
    description: 'Boshlanish sanasi',
    required: false,
  })
  @IsOptional()
  @IsString()
  date_from?: string;

  @ApiProperty({
    example: '2025-08-31',
    description: 'Tugash sanasi',
    required: false,
  })
  @IsOptional()
  @IsString()
  date_to?: string;

  @ApiProperty({
    example: 'week',
    enum: ['day', 'week', 'month'],
    description: 'Tahlil davri',
    required: false,
  })
  @IsOptional()
  @IsString()
  period?: 'day' | 'week' | 'month';
}
