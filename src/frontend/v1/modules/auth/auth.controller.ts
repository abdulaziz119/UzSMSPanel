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
import {
  AuthLoginDto,
  AuthResendOtpDto,
  AuthVerifyDto,
  RefreshTokenDto,
} from './dto/dto';
import { User } from './decorators/user.decorator';

@ApiBearerAuth()
@ApiTags('Auth')
@Controller({ path: '/frontend/auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Foydalanuvchi tizimga kirishi uchun login API
   * Telefon raqam orqali OTP kod yuboradi
   * Phone number va OTP kodni tasdiqlash uchun ishlatiladi
   */
  @ApiResponse({ type: ErrorResourceDto, status: 401 })
  @Post('/login')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @HttpCode(200)
  async login(
    @Body() body: AuthLoginDto,
  ): Promise<SingleResponse<{ expiresIn: number }>> {
    return await this.authService.login(body);
  }

  /**
   * OTP kodni qayta yuborish API
   * Agar avvalgi OTP kod kelmagan yoki vaqti tugagan bo'lsa
   * yangi OTP kodni qayta yuborish uchun ishlatiladi
   */
  @ApiResponse({ type: ErrorResourceDto, status: 429 })
  @Post('/resend-otp')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @HttpCode(200)
  async resendOtp(
    @Body() body: AuthResendOtpDto,
  ): Promise<SingleResponse<{ message: string }>> {
    return await this.authService.resendOtp(body);
  }

  /**
   * OTP kodni tasdiqlash va autentifikatsiya API
   * Yuborilgan OTP kodni tekshiradi va to'g'ri bo'lsa
   * access token va refresh token qaytaradi
   */
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

  /**
   * OTP holati haqida ma'lumot olish API
   * OTP kodning qolgan vaqti va qayta yuborish mumkinligini tekshiradi
   * Rate limiting uchun ishlatiladi
   */
  @Post('/otp-status')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @HttpCode(200)
  async getOtpStatus(
    @Body() body: AuthResendOtpDto,
  ): Promise<SingleResponse<{ remainingTime: number; canResend: boolean }>> {
    return await this.authService.getOtpStatus(body.phone);
  }

  /**
   * Token yangilash API
   * Access token muddati tugaganda refresh token yordamida
   * yangi access va refresh tokenlarni olish uchun ishlatiladi
   */
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

  /**
   * Tizimdan chiqish API
   * Foydalanuvchining sessiyasini tugatadi va
   * tokenlarni bekor qiladi (invalidate)
   */
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
