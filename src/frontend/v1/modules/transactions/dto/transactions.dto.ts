import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { PaginationParams } from '../../../../../utils/dto/dto';

export class CreateTransactionDto {
  @ApiProperty({ example: 100000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'card' })
  @IsNotEmpty()
  @IsString()
  payment_method: string;
}

export class UpdateTransactionDto {
  @ApiProperty({ example: 150000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiProperty({ example: 'bank_transfer', required: false })
  @IsOptional()
  @IsString()
  payment_method?: string;

  @ApiProperty({ example: 'completed', enum: ['pending', 'completed', 'failed'], required: false })
  @IsOptional()
  @IsEnum(['pending', 'completed', 'failed'])
  status?: 'pending' | 'completed' | 'failed';
}

export class TransactionQueryDto extends PaginationParams {
  @ApiProperty({ example: 'pending', enum: ['pending', 'completed', 'failed'], required: false })
  @IsOptional()
  @IsEnum(['pending', 'completed', 'failed'])
  status?: 'pending' | 'completed' | 'failed';

  @ApiProperty({ example: 'card', required: false })
  @IsOptional()
  @IsString()
  payment_method?: string;

  @ApiProperty({ example: 10000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  min_amount?: number;

  @ApiProperty({ example: 500000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_amount?: number;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  date_from?: Date;

  @ApiProperty({ example: '2024-12-31T23:59:59Z', required: false })
  @IsOptional()
  @IsDateString()
  date_to?: Date;
}
