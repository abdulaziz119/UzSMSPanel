import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { PaginationParams } from './dto';
import { MessageTypeEnum, OperatorEnum } from '../enum/sms-price.enum';

export class PriceFilterDto extends PaginationParams {
	@ApiPropertyOptional({ enum: OperatorEnum, description: 'Operator', example: 'BEELINE' })
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
	@ApiProperty({ enum: OperatorEnum, description: 'Operator', example: 'BEELINE' })
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
