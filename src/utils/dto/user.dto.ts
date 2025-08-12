import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { language } from '../enum/user.enum';

export class UpdateUserProfileDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiProperty({
    example: 'Tashkent, Yunusobod district, Amir Timur street 15',
    description: 'User address',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: {
      latitude: 41.311081,
      longitude: 69.240562,
      address: 'Tashkent, Yunusobod district',
    },
    description: 'User location coordinates',
    required: false,
  })
  @IsOptional()
  location?: Geolocation;

  @ApiProperty({
    example: 'uz',
    description: 'User preferred language',
    enum: language,
    required: false,
  })
  @IsOptional()
  @IsEnum(language, { message: 'Language must be one of: uz, ru, en' })
  language?: language;

  file_id?: number;
}
