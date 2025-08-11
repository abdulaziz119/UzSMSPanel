import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import {
  DashboardAuthLoginDto,
  DashboardAuthRegisterDto,
} from '../dashboard/v1/modules/auth/dto/dto';
import { OtpEntity } from '../entity/otp.entity';
import { UserEntity } from '../entity/user.entity';
import { AuthorizationService } from '../utils/authorization.service';
import { SingleResponse } from '../utils/dto/dto';
import { language } from '../utils/enum/user.enum';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly REFRESH_TOKEN_EXPIRY = 14 * 24 * 60 * 60 * 1000; // 14 days

  constructor(
    @Inject(MODELS.USER)
    private readonly userRepo: Repository<UserEntity>,
    @Inject(MODELS.OTP)
    private readonly otpRepo: Repository<OtpEntity>,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async dashboardLogin(payload: DashboardAuthLoginDto): Promise<
    SingleResponse<{
      id: number;
      role: string;
      token: string;
      refreshToken: string;
      login: string;
    }>
  > {
    try {
      const user: UserEntity = await this.findUserByLogin(payload.login);

      const token: string = await this.authorizationService.sign(
        user.id,
        undefined,
        user.role,
        user.login,
      );

      // Generate refresh token
      const refreshToken: string = this.generateRefreshToken();
      const refreshTokenExpiresAt = new Date(
        Date.now() + this.REFRESH_TOKEN_EXPIRY,
      );

      // Save refresh token to database
      await this.userRepo.update(
        { id: user.id },
        {
          refreshToken,
          refreshTokenExpiresAt,
        },
      );

      const result = {
        token,
        refreshToken,
        role: user.role,
        id: user.id,
        login: user.login,
      };

      this.logger.log(`Dashboard login successful for user: ${user.id}`);
      return { result };
    } catch (error: any) {
      throw new HttpException(
        { message: 'Login failed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async register(
    payload: DashboardAuthRegisterDto,
  ): Promise<SingleResponse<UserEntity>> {
    try {
      const existingUser: UserEntity = await this.userRepo.findOne({
        where: { email: payload.email },
      });

      if (existingUser) {
        throw new HttpException('User already exists', HttpStatus.CONFLICT);
      }

      const newUser: UserEntity = this.userRepo.create({
        role: payload.role,
        email: payload.email,
        login: payload.login,
        language: language.UZ,
      });

      const result = await this.userRepo.save(newUser);

      this.logger.log(`New user registered: ${result.id}`);
      return { result };
    } catch (error: any) {
      throw new HttpException(
        { message: 'Registration failed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async findUserByLogin(login: string): Promise<UserEntity> {
    const user: UserEntity = await this.userRepo.findOne({
      where: { login },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
