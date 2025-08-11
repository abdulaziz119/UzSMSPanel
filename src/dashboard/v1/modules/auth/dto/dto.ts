import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRoleEnum } from '../../../../../utils/enum/user.enum';

export class DashboardAuthLoginDto {
  @ApiProperty({ example: 'admin' })
  @IsNotEmpty()
  login: string;

  @ApiProperty({ example: 'test' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class DashboardAuthRegisterDto {
  @ApiProperty({ example: 'test@gmail.com' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'test@gmail.com' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'admin', enum: UserRoleEnum })
  @IsEnum(UserRoleEnum)
  @IsNotEmpty()
  role: UserRoleEnum;

  @ApiProperty({ example: 'true' })
  @IsNotEmpty()
  login: string;

  @ApiProperty({ example: '12345' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
