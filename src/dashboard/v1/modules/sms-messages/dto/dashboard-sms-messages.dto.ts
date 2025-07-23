import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { PaginationParams } from '../../../../../utils/dto/dto';

export class CreateSmsMessageDto {
  @ApiProperty({ example: '+998901234567' })
  @IsNotEmpty()
  @IsString()
  recipient_phone: string;

  @ApiProperty({ example: 'Hello, this is a test message' })
  @IsNotEmpty()
  @IsString()
  message_text: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @ApiProperty({ example: [1, 2], required: false })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  tariff_ids?: number[];
}

export class UpdateSmsMessageDto {
  @ApiProperty({ example: '+998901234567', required: false })
  @IsOptional()
  @IsString()
  recipient_phone?: string;

  @ApiProperty({ example: 'Updated message text', required: false })
  @IsOptional()
  @IsString()
  message_text?: string;

  @ApiProperty({ example: 'sent', enum: ['pending', 'sent', 'failed'], required: false })
  @IsOptional()
  @IsEnum(['pending', 'sent', 'failed'])
  status?: 'pending' | 'sent' | 'failed';

  @ApiProperty({ example: '2024-01-01T00:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  sent_at?: Date;
}

export class SmsMessageQueryDto extends PaginationParams {
  @ApiProperty({ example: 'pending', enum: ['pending', 'sent', 'failed'], required: false })
  @IsOptional()
  @IsEnum(['pending', 'sent', 'failed'])
  status?: 'pending' | 'sent' | 'failed';

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  user_id?: number;

  @ApiProperty({ example: '+998901234567', required: false })
  @IsOptional()
  @IsString()
  recipient_phone?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  date_from?: Date;

  @ApiProperty({ example: '2024-12-31T23:59:59Z', required: false })
  @IsOptional()
  @IsDateString()
  date_to?: Date;
}
