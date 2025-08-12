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
import { ContactStatusEnum } from '../enum/contact.enum';
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

  @ApiProperty({ example: '+998901234567', description: 'Phone number' })
  @IsString()
  @IsNotEmpty()
  @Length(9, 20)
  phone: string;

  @ApiPropertyOptional({ example: '101', description: 'Phone extension' })
  @IsString()
  @IsOptional()
  @Length(1, 8)
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

  @ApiPropertyOptional({ example: 'Chilonzor street, Tashkent' })
  @IsString()
  @IsOptional()
  address?: string;

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

  @ApiPropertyOptional({ example: '+998' })
  @IsString()
  @Length(1, 10)
  @IsOptional()
  prefix?: string;

  @ApiProperty({ enum: language, example: language.UZ })
  @IsEnum(language)
  @IsOptional()
  lang?: language;
}
