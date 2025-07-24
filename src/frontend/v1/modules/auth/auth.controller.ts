import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiResponse, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { AuthLoginDto, AuthVerifyDto, VerifyOtpDto } from './dto/dto';
import { SingleResponse } from '../../../../utils/dto/dto';
import { AuthService } from '../../../../service/auth.service';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponse({ type: ErrorResourceDto, status: 401 })
  @Post('/login')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @HttpCode(200)
  async login(
    @Body() body: AuthLoginDto,
  ): Promise<SingleResponse<{ user: string }>> {
    return await this.authService.login(body);
  }

  @ApiResponse({ type: ErrorResourceDto, status: 401 })
  @Post('/verify-otp')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @HttpCode(200)
  async verifyOtp(
    @Body() body: VerifyOtpDto,
  ): Promise<SingleResponse<{ user: string }>> {
    return this.authService.verifyOtp(body);
  }

  @ApiResponse({ type: ErrorResourceDto, status: 401 })
  @Post('/sign-verify')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @HttpCode(200)
  async signVerify(
    @Body() body: AuthVerifyDto,
  ): Promise<SingleResponse<{ id: number; role: string; token: string }>> {
    return this.authService.signVerify(body);
  }
}
