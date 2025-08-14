import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsArray,
	IsBoolean,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationParams } from './dto';
import { MessageTypeEnum, OperatorEnum } from '../enum/sms-price.enum';

export class PriceFilterDto extends PaginationParams {
	@ApiPropertyOptional({ enum: OperatorEnum, description: 'Operator', example: OperatorEnum.BEELINE })
	@IsOptional()
	@IsEnum(OperatorEnum)
	operator?: OperatorEnum;

	@ApiPropertyOptional({ enum: MessageTypeEnum, description: 'Xabar turi', example: MessageTypeEnum.SMS })
	@IsOptional()
	@IsEnum(MessageTypeEnum)
	message_type?: MessageTypeEnum;

	@ApiPropertyOptional({ description: 'Faol holati', example: true })
	@IsOptional()
	@IsBoolean()
	is_active?: boolean;
}

export class CreatePriceDto {
	@ApiProperty({ description: 'Davlat kodi (masalan: UZ yoki +998)', example: 'UZ' })
	@IsString()
	@IsNotEmpty()
	country_code: string;

	@ApiProperty({ description: 'Davlat nomi', example: 'Uzbekistan' })
	@IsString()
	@IsNotEmpty()
	country_name: string;

	@ApiProperty({ enum: OperatorEnum, description: 'Operator', example: OperatorEnum.BEELINE })
	@IsEnum(OperatorEnum)
	@IsNotEmpty()
	operator: OperatorEnum;

	@ApiProperty({ enum: MessageTypeEnum, description: 'Xabar turi', example: MessageTypeEnum.SMS })
	@IsEnum(MessageTypeEnum)
	@IsNotEmpty()
	message_type: MessageTypeEnum;

	@ApiProperty({ description: 'SMS narxi', example: 100 })
	@IsNumber()
	@IsNotEmpty()
	price_per_sms: number;

	@ApiPropertyOptional({ description: 'Izoh', example: 'Aktsiya narxi' })
	@IsOptional()
	description?: string;
}

export class UpdatePriceDto {
	@ApiProperty({ description: 'Yozuv ID', example: 1 })
	@IsNumber()
	@IsNotEmpty()
	id: number;

	@ApiPropertyOptional({ description: 'SMS narxi', example: 120 })
	@IsOptional()
	@IsNumber()
	price_per_sms?: number;

	@ApiPropertyOptional({ description: 'Izoh', example: 'Yangilandi' })
	@IsOptional()
	description?: string;

	@ApiPropertyOptional({ description: 'Faol holati', example: true })
	@IsOptional()
	@IsBoolean()
	is_active?: boolean;
}

export class BulkUpdatePriceItemDto {
	@ApiProperty({ description: 'Yozuv ID', example: 1 })
	@IsNumber()
	@IsNotEmpty()
	id: number;

	@ApiPropertyOptional({ description: 'SMS narxi', example: 120 })
	@IsOptional()
	@IsNumber()
	price_per_sms?: number;

	@ApiPropertyOptional({ description: 'Faol holati', example: true })
	@IsOptional()
	@IsBoolean()
	is_active?: boolean;
}

export class BulkUpdatePricesDto {
	@ApiProperty({ type: [BulkUpdatePriceItemDto] })
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => BulkUpdatePriceItemDto)
	updates: BulkUpdatePriceItemDto[];
}
