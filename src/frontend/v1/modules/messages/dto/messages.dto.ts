import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsArray, IsNotEmpty } from 'class-validator';

export class SendToContactDto {
  @ApiProperty({ example: 123, description: 'Contact ID' })
  @IsNumber()
  @IsNotEmpty()
  contact_id: number;

  @ApiProperty({ example: 'Xizmat habar', description: 'SMS matni' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ example: 'SENDER', required: false })
  @IsOptional()
  @IsString()
  sender?: string;
}

export class SendToGroupDto {
  @ApiProperty({ example: 12, description: 'Group ID' })
  @IsNumber()
  @IsNotEmpty()
  group_id: number;

  @ApiProperty({ example: 'Promo matni', description: 'SMS matni' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ example: 'SENDER', required: false })
  @IsOptional()
  @IsString()
  sender?: string;

  @ApiProperty({ example: 100, description: 'Batch size (optional)', required: false })
  @IsOptional()
  @IsNumber()
  batch_size?: number;
}
