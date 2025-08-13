import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsArray, IsPhoneNumber } from 'class-validator';
import { MessageStatusEnum, MessageDirectionEnum } from '../enum/sms-message.enum';
import { MessageTypeEnum, OperatorEnum } from '../enum/sms-price.enum';
import { PaginationParams } from './dto';

export class SendSingleSmsDto {
  @ApiProperty({ 
    example: "998901234567",
    description: "Telefon raqam"
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ 
    example: "998",
    description: "Telefon kod",
    required: false
  })
  @IsOptional()
  @IsString()
  phone_ext?: string;

  @ApiProperty({ 
    example: "Test SMS xabari",
    description: "SMS matn"
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ 
    example: "UzSMS",
    description: "Jo'natuvchi nomi",
    required: false
  })
  @IsOptional()
  @IsString()
  sender?: string;

  @ApiProperty({ 
    example: "SMS",
    enum: MessageTypeEnum,
    description: "Xabar turi",
    required: false
  })
  @IsOptional()
  @IsEnum(MessageTypeEnum)
  message_type?: MessageTypeEnum;
}

export class SendBulkSmsDto {
  @ApiProperty({ 
    example: ["998901234567", "998907654321", "998903456789"],
    description: "Telefon raqamlar ro'yxati"
  })
  @IsArray()
  @IsString({ each: true })
  phones: string[];

  @ApiProperty({ 
    example: "Hammaga yuborilayotgan xabar",
    description: "SMS matn"
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ 
    example: "UzSMS",
    description: "Jo'natuvchi nomi",
    required: false
  })
  @IsOptional()
  @IsString()
  sender?: string;

  @ApiProperty({ 
    example: "SMS",
    enum: MessageTypeEnum,
    description: "Xabar turi",
    required: false
  })
  @IsOptional()
  @IsEnum(MessageTypeEnum)
  message_type?: MessageTypeEnum;

  @ApiProperty({ 
    example: "2025-12-31T23:00:00Z",
    description: "Rejalashtirilgan vaqt",
    required: false
  })
  @IsOptional()
  @IsString()
  scheduled_at?: string;
}

export class SmsHistoryFilterDto extends PaginationParams {
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
    example: "DELIVERED",
    enum: MessageStatusEnum,
    description: "SMS holati",
    required: false
  })
  @IsOptional()
  @IsEnum(MessageStatusEnum)
  status?: MessageStatusEnum;

  @ApiProperty({ 
    example: "998901234567",
    description: "Telefon raqam",
    required: false
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ 
    example: "UzSMS",
    description: "Jo'natuvchi nomi",
    required: false
  })
  @IsOptional()
  @IsString()
  sender?: string;
}

export class MessageFilterDto extends PaginationParams {
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
    example: "DELIVERED",
    enum: MessageStatusEnum,
    description: "SMS holati",
    required: false
  })
  @IsOptional()
  @IsEnum(MessageStatusEnum)
  status?: MessageStatusEnum;

  @ApiProperty({ 
    example: "998901234567",
    description: "Telefon raqam",
    required: false
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ 
    example: "UzSMS",
    description: "Jo'natuvchi nomi",
    required: false
  })
  @IsOptional()
  @IsString()
  sender?: string;

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
    example: "OUTBOUND",
    enum: MessageDirectionEnum,
    description: "SMS yo'nalishi",
    required: false
  })
  @IsOptional()
  @IsEnum(MessageDirectionEnum)
  direction?: MessageDirectionEnum;

  @ApiProperty({ 
    example: "test xabar",
    description: "Qidiruv matni",
    required: false
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class MessageStatsDto {
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

export class BulkResendDto {
  @ApiProperty({ 
    example: [1, 2, 3],
    description: "SMS ID'lari"
  })
  @IsArray()
  @IsNumber({}, { each: true })
  message_ids: number[];
}