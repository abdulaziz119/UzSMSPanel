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
    example: 'Welcome to our service!', 
    description: 'Email subject' 
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ 
    example: '<h1>Welcome!</h1><p>Thank you for joining us.</p>', 
    description: 'Email HTML content' 
  })
  @IsString()
  @IsNotEmpty()
  html_content: string;

  @ApiProperty({ 
    example: 'Welcome! Thank you for joining us.', 
    description: 'Email text content',
    required: false
  })
  @IsString()
  @IsOptional()
  text_content?: string;
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
    example: 'Newsletter Update', 
    description: 'Email subject' 
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ 
    example: '<h1>Newsletter</h1><p>Latest updates...</p>', 
    description: 'Email HTML content' 
  })
  @IsString()
  @IsNotEmpty()
  html_content: string;

  @ApiProperty({ 
    example: 'Newsletter. Latest updates...', 
    description: 'Email text content',
    required: false
  })
  @IsString()
  @IsOptional()
  text_content?: string;
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
    example: 'Service notification', 
    required: false, 
    description: 'Email subject (subject yoki email_template_id dan bittasi majburiy)' 
  })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({ 
    example: '<h1>Service</h1><p>Notification content</p>', 
    required: false, 
    description: 'Email HTML content' 
  })
  @IsString()
  @IsOptional()
  html_content?: string;

  @ApiProperty({ 
    example: 45, 
    required: false, 
    description: 'Email shablon ID (subject yoki email_template_id dan bittasi majburiy)' 
  })
  @IsNumber()
  @IsOptional()
  email_template_id?: number;
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
    example: 'Promotional email', 
    required: false, 
    description: 'Email subject (subject yoki email_template_id dan bittasi majburiy)' 
  })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({ 
    example: '<h1>Promo</h1><p>Special offer...</p>', 
    required: false, 
    description: 'Email HTML content' 
  })
  @IsString()
  @IsOptional()
  html_content?: string;

  @ApiProperty({ 
    example: 45, 
    required: false, 
    description: 'Email shablon ID (subject yoki email_template_id dan bittasi majburiy)' 
  })
  @IsNumber()
  @IsOptional()
  email_template_id?: number;
}
