import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Length, IsPhoneNumber, IsEnum } from 'class-validator';
import { UserRoleEnum } from '../enum/user.enum';

export class LoginDto {
  @ApiProperty({ 
    example: "998901234567",
    description: "Telefon raqam"
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ 
    example: "998",
    description: "Telefon kod"
  })
  @IsString()
  @IsNotEmpty()
  phone_ext: string;
}

export class VerifyOtpDto {
  @ApiProperty({ 
    example: "998901234567",
    description: "Telefon raqam"
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ 
    example: "998",
    description: "Telefon kod"
  })
  @IsString()
  @IsNotEmpty()
  phone_ext: string;

  @ApiProperty({ 
    example: "123456",
    description: "OTP kod"
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;
}

export class ResendOtpDto {
  @ApiProperty({ 
    example: "998901234567",
    description: "Telefon raqam"
  })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class OtpStatusDto {
  @ApiProperty({ 
    example: "998901234567",
    description: "Telefon raqam"
  })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class RefreshTokenDto {
  @ApiProperty({ 
    example: "refresh_token_here",
    description: "Refresh token"
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

// Dashboard Admin Auth DTO'lari
export class AdminLoginDto {
  @ApiProperty({ 
    example: "admin",
    description: "Admin login"
  })
  @IsString()
  @IsNotEmpty()
  login: string;

  @ApiProperty({ 
    example: "password123",
    description: "Admin parol"
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class AdminRegisterDto {
  @ApiProperty({ 
    example: "newadmin",
    description: "Admin login"
  })
  @IsString()
  @IsNotEmpty()
  login: string;

  @ApiProperty({ 
    example: "admin@example.com",
    description: "Admin email"
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    example: "password123",
    description: "Admin parol"
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 50)
  password: string;

  @ApiProperty({ 
    example: "ADMIN",
    enum: UserRoleEnum,
    description: "Admin roli"
  })
  @IsEnum(UserRoleEnum)
  role: UserRoleEnum;
}
