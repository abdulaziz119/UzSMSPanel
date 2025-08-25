import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsOptional,
  IsArray,
  IsNotEmpty,
  IsEmail,
  Length,
} from 'class-validator';

export class SendEmailToContactDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 12, 
    description: 'Email template ID' 
  })
  @IsNumber()
  @IsNotEmpty()
  email_template_id: number;
}

export class SendEmailToGroupDto {
  @ApiProperty({ 
    example: 12, 
    description: 'Email Group ID' 
  })
  @IsNumber()
  @IsNotEmpty()
  group_id: number;

  @ApiProperty({ 
    example: 12, 
    description: 'Email template ID' 
  })
  @IsNumber()
  @IsNotEmpty()
  email_template_id: number;
}

export class CanSendEmailToContactDto {
  @ApiProperty({ 
    example: 'user@example.com', 
    required: false, 
    description: 'Email address (email yoki contact_id dan bittasi majburiy)' 
  })
  @IsString()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ 
    example: 123, 
    required: false, 
    description: 'Email kontakt ID (email yoki contact_id dan bittasi majburiy)' 
  })
  @IsNumber()
  @IsOptional()
  contact_id?: number;

  @ApiProperty({ 
    example: 45, 
    description: 'Email shablon ID' 
  })
  @IsNumber()
  @IsNotEmpty()
  email_template_id: number;
}

export class CanSendEmailToGroupDto {
  @ApiProperty({ 
    example: 12, 
    description: 'Email Group ID' 
  })
  @IsNumber()
  @IsNotEmpty()
  group_id: number;

  @ApiProperty({ 
    example: 45, 
    description: 'Email shablon ID' 
  })
  @IsNumber()
  @IsNotEmpty()
  email_template_id: number;
}
