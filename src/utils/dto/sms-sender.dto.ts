import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDefined,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { SenderStatusEnum } from '../enum/sms-sender.enum';

export class CreateSmsSenderDto {
  @ApiProperty({
    example: 'ESKIZ',
    description: 'Alfa nomi (sender id) 3-11 latin',
  })
  @IsString()
  @Length(3, 20)
  name: string;

  @ApiPropertyOptional({ description: 'Tashkilot faoliyati haqida qisqacha' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Telegram/website links',
    example: 'https://t.me/example, https://example.uz',
  })
  @IsString()
  @IsOptional()
  links?: string;

  @ApiProperty({
    example: 1,
    description: 'Sender price ID (SenderPriceEntity dan)',
  })
  @IsNumber()
  @IsDefined()
  sender_price_id: number;
}

export class UpdateSmsSenderDto {
  @ApiProperty({ example: 1 })
  @IsDefined()
  @IsNumber()
  id: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Length(3, 20)
  name?: string;

  @ApiPropertyOptional({ enum: SenderStatusEnum })
  @IsEnum(SenderStatusEnum)
  @IsOptional()
  status?: SenderStatusEnum;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  links?: string;

  @ApiPropertyOptional({ 
    example: 1,
    description: 'Sender price ID (SenderPriceEntity dan)'
  })
  @IsNumber()
  @IsOptional()
  sender_price_id?: number;
}
