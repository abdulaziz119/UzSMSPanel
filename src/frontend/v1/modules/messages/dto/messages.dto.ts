import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsOptional,
  IsArray,
  IsNotEmpty,
  Length,
} from 'class-validator';

export class SendToContactDto {
  @ApiProperty({
    example: '901234567',
    description: 'Phone number without country code',
  })
  @IsString()
  @IsNotEmpty()
  @Length(7, 15)
  phone: string;

  @ApiProperty({ example: 'Xizmat habar', description: 'SMS matni' })
  @IsString()
  @IsNotEmpty()
  message: string;
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
}
