import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthLoginDto {
  @ApiProperty({ example: 'test@test.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'test' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'test@test.com' })
  @IsString()
  @IsNotEmpty()
  email: string;
}

export class AuthVerifyDto {
  @ApiProperty({ example: 'test@test.com' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '12345' })
  @IsString()
  @IsNotEmpty()
  otp: string;
}
