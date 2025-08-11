import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class AuthVerifyDto {
  @ApiProperty({
    example: '+998901234567',
    description: 'Uzbekistan phone number in format +998XXXXXXXXX',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+998[0-9]{9}$/, {
    message: 'Phone number must be in format +998XXXXXXXXX',
  })
  phone: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit OTP code',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^[0-9]{6}$/, {
    message: 'OTP must contain only digits',
  })
  otp: string;
}

export class AuthResendOtpDto {
  @ApiProperty({
    example: '+998901234567',
    description: 'Uzbekistan phone number in format +998XXXXXXXXX',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+998[0-9]{9}$/, {
    message: 'Phone number must be in format +998XXXXXXXXX',
  })
  phone: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
    description: 'Refresh token received during login',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
