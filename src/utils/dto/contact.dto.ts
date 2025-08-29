import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEmail,
  Length,
  IsDateString,
} from 'class-validator';
import { ContactStatusEnum, ContactTypeEnum } from '../enum/contact.enum';
import { language } from '../enum/user.enum';

export class CreateContactDto {
  @ApiProperty({ enum: ContactStatusEnum, example: ContactStatusEnum.ACTIVE })
  @IsEnum(ContactStatusEnum)
  @IsOptional()
  status?: ContactStatusEnum;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 1995 })
  @IsNumber()
  @IsOptional()
  birth_year?: number;

  @ApiPropertyOptional({ example: 'Uzbekistan' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: 'Tashkent' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    example: '901234567',
    description: 'Phone number without country code',
  })
  @IsString()
  @IsNotEmpty()
  @Length(7, 15)
  phone: string;

  @ApiPropertyOptional({ example: '998', description: 'Country phone code' })
  @IsString()
  @IsOptional()
  @Length(1, 5)
  phone_ext?: string;

  @ApiPropertyOptional({ example: 'example@mail.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'AB' })
  @IsString()
  @Length(2, 10)
  @IsOptional()
  passport_seria?: string;

  @ApiPropertyOptional({ example: '1234567' })
  @IsString()
  @Length(1, 20)
  @IsOptional()
  passport_number?: string;

  @ApiPropertyOptional({ example: 'Tashkent IIB' })
  @IsString()
  @IsOptional()
  passport_given_by?: string;

  @ApiPropertyOptional({ example: '2030-01-01' })
  @IsDateString()
  @IsOptional()
  passport_expiration_date?: Date;

  @ApiPropertyOptional({ example: 12345, description: 'Passport file ID' })
  @IsNumber()
  @IsOptional()
  passport_file_id?: number;

  @ApiPropertyOptional({ example: 'Chilonzor street, Tashkent' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: 12346,
    description: 'Address document file ID',
  })
  @IsNumber()
  @IsOptional()
  address_file_id?: number;

  @ApiPropertyOptional({ example: 'My Company LLC' })
  @IsString()
  @IsOptional()
  company_name?: string;

  @ApiPropertyOptional({ example: 'National Bank' })
  @IsString()
  @IsOptional()
  company_bank_name?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsString()
  @Length(1, 20)
  @IsOptional()
  company_bank_id?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsString()
  @Length(1, 20)
  @IsOptional()
  company_inn?: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsString()
  @Length(1, 20)
  @IsOptional()
  company_mfo?: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsString()
  @Length(1, 20)
  @IsOptional()
  company_okonx?: string;

  @ApiPropertyOptional({
    example: 'uz',
    description: 'Country code/identifier',
  })
  @IsString()
  @Length(2, 5)
  @IsOptional()
  prefix?: string;

  @ApiProperty({ enum: language, example: language.UZ })
  @IsEnum(language)
  @IsOptional()
  lang?: language;
}

// DTO for creating individual contact
export class CreateIndividualContactDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

// DTO for creating company contact
export class CreateCompanyContactDto {
  @ApiProperty({ enum: ContactStatusEnum, example: ContactStatusEnum.ACTIVE })
  @IsEnum(ContactStatusEnum)
  @IsOptional()
  status?: ContactStatusEnum;

  @ApiProperty({ example: 'My Company LLC' })
  @IsString()
  @IsNotEmpty()
  company_name: string;

  @ApiPropertyOptional({ example: 'Contact Person Name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Uzbekistan' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: 'Tashkent' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    example: '901234567',
    description: 'Phone number without country code',
  })
  @IsString()
  @IsNotEmpty()
  @Length(7, 15)
  phone: string;

  @ApiPropertyOptional({ example: '998', description: 'Country phone code' })
  @IsString()
  @IsOptional()
  @Length(1, 5)
  phone_ext?: string;

  @ApiPropertyOptional({ example: 'company@mail.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Chilonzor street, Tashkent' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'National Bank' })
  @IsString()
  @IsNotEmpty()
  company_bank_name: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  company_bank_id: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  company_inn: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  company_mfo: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsString()
  @Length(1, 20)
  @IsOptional()
  company_okonx?: string;

  @ApiPropertyOptional({
    example: 'uz',
    description: 'Country code/identifier',
  })
  @IsString()
  @Length(2, 5)
  @IsOptional()
  prefix?: string;

  @ApiProperty({ enum: language, example: language.UZ })
  @IsEnum(language)
  @IsOptional()
  lang?: language;
}
