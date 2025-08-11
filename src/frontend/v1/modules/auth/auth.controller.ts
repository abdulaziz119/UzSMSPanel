import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from '../../../../service/auth.service';
import { SingleResponse } from '../../../../utils/dto/dto';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { Auth } from './decorators/auth.decorator';
import { Roles } from './decorators/roles.decorator';
import { AuthResendOtpDto, AuthVerifyDto, RefreshTokenDto } from './dto/dto';
import { User } from './decorators/user.decorator';

@ApiBearerAuth()
@ApiTags('Auth')
@Controller({ path: '/frontend/auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponse({ type: ErrorResourceDto, status: 429 })
  @Post('/resend-otp')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @HttpCode(200)
  async resendOtp(
    @Body() body: AuthResendOtpDto,
  ): Promise<SingleResponse<{ message: string }>> {
    return await this.authService.resendOtp(body);
  }

  @ApiResponse({ type: ErrorResourceDto, status: 401 })
  @Post('/sign-verify')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @HttpCode(200)
  async signVerify(@Body() body: AuthVerifyDto): Promise<
    SingleResponse<{
      token: string;
      refreshToken: string;
      user: any;
    }>
  > {
    const result = await this.authService.signVerify(body);

    return result;
  }

  @Post('/otp-status')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @HttpCode(200)
  async getOtpStatus(
    @Body() body: AuthResendOtpDto,
  ): Promise<SingleResponse<{ remainingTime: number; canResend: boolean }>> {
    return await this.authService.getOtpStatus(body.phone);
  }

  @ApiResponse({
    schema: {
      type: 'object',
      properties: {
        result: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
  })
  @Post('/refresh-token')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @HttpCode(200)
  async refreshToken(
    @Body() body: RefreshTokenDto,
  ): Promise<SingleResponse<{ token: string; refreshToken: string }>> {
    return await this.authService.refreshToken(body.refreshToken);
  }

  @ApiResponse({
    schema: {
      type: 'object',
      properties: {
        result: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  })
  @Post('/logout')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @HttpCode(200)
  @Auth(false)
  @Roles(UserRoleEnum.CLIENT)
  async logout(
    @User('id') user_id: number,
  ): Promise<SingleResponse<{ message: string }>> {
    return await this.authService.logout(user_id);
  }
}
