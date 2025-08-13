import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { CampaignTypeEnum, CampaignStatusEnum } from '../enum/sms-campaign.enum';
import { MessageTypeEnum } from '../enum/sms-price.enum';
import { PaginationParams } from './dto';

export class CreateCampaignDto {
  @ApiProperty({ 
    example: "Yangi yil kampaniyasi",
    description: "Kampaniya nomi"
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    example: "Yangi yil uchun tabriklar",
    description: "Kampaniya tavsifi",
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    example: 1,
    description: "Guruh ID"
  })
  @IsNumber()
  group_id: number;

  @ApiProperty({ 
    example: 2,
    description: "Shablon ID",
    required: false
  })
  @IsOptional()
  @IsNumber()
  template_id?: number;

  @ApiProperty({ 
    example: "Yangi yil muborak!",
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
    example: "IMMEDIATE",
    enum: CampaignTypeEnum,
    description: "Kampaniya turi"
  })
  @IsEnum(CampaignTypeEnum)
  type: CampaignTypeEnum;

  @ApiProperty({ 
    example: "2025-12-31T23:00:00Z",
    description: "Rejalashtirilgan vaqt",
    required: false
  })
  @IsOptional()
  @IsDateString()
  scheduled_at?: string;

  @ApiProperty({ 
    description: "Qo'shimcha sozlamalar",
    required: false
  })
  @IsOptional()
  settings?: any;
}

export class UpdateCampaignDto {
  @ApiProperty({ 
    example: 1,
    description: "Kampaniya ID"
  })
  @IsNumber()
  id: number;

  @ApiProperty({ 
    example: "Yangi nom",
    description: "Kampaniya nomi",
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ 
    example: "Yangi tavsif",
    description: "Kampaniya tavsifi",
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    example: "Yangi xabar",
    description: "SMS matn",
    required: false
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ 
    example: "NewSender",
    description: "Jo'natuvchi nomi",
    required: false
  })
  @IsOptional()
  @IsString()
  sender?: string;

  @ApiProperty({ 
    example: "2025-12-31T23:00:00Z",
    description: "Rejalashtirilgan vaqt",
    required: false
  })
  @IsOptional()
  @IsDateString()
  scheduled_at?: string;

  @ApiProperty({ 
    description: "Qo'shimcha sozlamalar",
    required: false
  })
  @IsOptional()
  settings?: any;
}

export class CampaignFilterDto extends PaginationParams {
  @ApiProperty({ 
    example: "RUNNING",
    enum: CampaignStatusEnum,
    description: "Kampaniya holati",
    required: false
  })
  @IsOptional()
  @IsEnum(CampaignStatusEnum)
  status?: CampaignStatusEnum;

  @ApiProperty({ 
    example: "SCHEDULED",
    enum: CampaignTypeEnum,
    description: "Kampaniya turi",
    required: false
  })
  @IsOptional()
  @IsEnum(CampaignTypeEnum)
  type?: CampaignTypeEnum;

  @ApiProperty({ 
    example: 1,
    description: "Foydalanuvchi ID",
    required: false
  })
  @IsOptional()
  @IsNumber()
  user_id?: number;

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
    example: "yangi yil",
    description: "Qidiruv matni",
    required: false
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CampaignStatsDto {
  @ApiProperty({ 
    example: 1,
    description: "Kampaniya ID",
    required: false
  })
  @IsOptional()
  @IsNumber()
  campaign_id?: number;

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

export class BulkCampaignActionDto {
  @ApiProperty({ 
    example: [1, 2, 3],
    description: "Kampaniya ID'lari"
  })
  @IsArray()
  @IsNumber({}, { each: true })
  campaign_ids: number[];

  @ApiProperty({ 
    example: "start",
    enum: ["start", "pause", "cancel"],
    description: "Amal turi"
  })
  @IsEnum(["start", "pause", "cancel"])
  action: 'start' | 'pause' | 'cancel';
}