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

export class CanSendContactDto {
  @ApiProperty({
    example: '998901234567',
    required: false,
    description: 'Telefon raqami (phone yoki contact_id dan bittasi majburiy)',
  })
  @IsString()
  @IsOptional()
  @Length(7, 20)
  phone?: string;

  @ApiProperty({
    example: 123,
    required: false,
    description: 'Kontakt ID (phone yoki contact_id dan bittasi majburiy)',
  })
  @IsNumber()
  @IsOptional()
  contact_id?: number;

  @ApiProperty({
    example: 'Xizmat habari',
    required: false,
    description:
      'SMS matni (message yoki sms_template_id dan bittasi majburiy)',
  })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({
    example: 45,
    required: false,
    description:
      'SMS shablon ID (message yoki sms_template_id dan bittasi majburiy)',
  })
  @IsNumber()
  @IsOptional()
  sms_template_id?: number;
}

export class CanSendGroupDto {
  @ApiProperty({ example: 12, description: 'Group ID' })
  @IsNumber()
  @IsNotEmpty()
  group_id: number;

  @ApiProperty({
    example: 'Promo habari',
    required: false,
    description:
      'SMS matni (message yoki sms_template_id dan bittasi majburiy)',
  })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({
    example: 45,
    required: false,
    description:
      'SMS shablon ID (message yoki sms_template_id dan bittasi majburiy)',
  })
  @IsNumber()
  @IsOptional()
  sms_template_id?: number;
}
