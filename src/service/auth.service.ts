import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import {
  DashboardAuthLoginDto,
  DashboardAuthRegisterDto,
} from '../dashboard/v1/modules/auth/dto/dto';
import { OtpEntity } from '../entity/otp.entity';
import { UserEntity } from '../entity/user.entity';
import {
  AuthLoginDto,
  AuthResendOtpDto,
  AuthSendOtpDto,
  AuthVerifyDto,
} from '../frontend/v1/modules/auth/dto/dto';
import { AuthorizationService } from '../utils/authorization.service';
import { SingleResponse } from '../utils/dto/dto';
import { language, UserRoleEnum } from '../utils/enum/user.enum';
import { ContactEntity } from '../entity/contact.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly OTP_EXPIRY_TIME = 120000; // 2 minutes
  private readonly OTP_MIN = 100000;
  private readonly OTP_MAX = 999999;
  private readonly MAX_ATTEMPTS = 5;
  private readonly BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly RESEND_COOLDOWN = 60000; // 1 minute between resends
  private readonly REFRESH_TOKEN_EXPIRY = 14 * 24 * 60 * 60 * 1000; // 14 days

  constructor(
    @Inject(MODELS.USER)
    private readonly userRepo: Repository<UserEntity>,
    @Inject(MODELS.OTP)
    private readonly otpRepo: Repository<OtpEntity>,
    @Inject(MODELS.CONTACT)
    private readonly contactRepo: Repository<ContactEntity>,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async loginFrontend(payload: AuthLoginDto): Promise<
    SingleResponse<{
      token: string;
      user: {
        id: number;
        phone: string;
        role: string;
        language: string;
        block: boolean;
      };
    }>
  > {
    try {
      await this.checkPhoneBlocked(payload.phone);

      const user: UserEntity = await this.userRepo.findOne({
        where: { phone: payload.phone, phone_ext: payload.phone_ext },
        select: ['id', 'phone', 'phone_ext', 'password', 'role'],
      });
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      if (!user || !(await bcrypt.compare(payload.password, user.password))) {
        throw new HttpException('Invalid  password', HttpStatus.UNAUTHORIZED);
      }

      const token: string = await this.authorizationService.sign(
        user.id,
        user.phone,
        user.role,
      );
      const result = {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
          language: user.language,
          block: user.block,
        },
      };
      return { result: result };
    } catch (error) {
      throw new HttpException(
        {
          message: 'Login failed.',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendOtp(
    payload: AuthSendOtpDto,
  ): Promise<SingleResponse<{ expiresIn: number }>> {
    try {
      // Check if phone is blocked
      await this.checkPhoneBlocked(payload.phone);

      const user: UserEntity = await this.userRepo.findOne({
        where: { phone: payload.phone, phone_ext: payload.phone_ext },
      });
      const hashedPassword: string = await bcrypt.hash(payload.password, 10);

      if (!user) {
        await this.createNewUser(
          payload.phone,
          payload.phone_ext,
          hashedPassword,
        );
      }

      await this.handleOtpCreation(payload.phone);

      this.logger.log(`OTP sent to phone: ${payload.phone}`);
      return { result: { expiresIn: 120 } };
    } catch (error) {
      throw new HttpException(
        {
          message: 'Login failed.',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async signVerify(payload: AuthVerifyDto): Promise<
    SingleResponse<{
      token: string;
      refreshToken: string;
      user: any;
    }>
  > {
    try {
      const user: UserEntity = await this.findUserByPhone(payload.phone);

      const isTestUser: boolean =
        (payload.phone === '901234576' && payload.otp === '123456') ||
        (payload.phone === '901234574' && payload.otp === '123456') ||
        (payload.phone === '901234573' && payload.otp === '123456') ||
        (payload.phone === '901234571' && payload.otp === '123456') ||
        (payload.phone === '901234570' && payload.otp === '123456') ||
        (payload.phone === '901234569' && payload.otp === '123456');

      if (!isTestUser) {
        // Validate OTP for regular users
        const otp: OtpEntity = await this.validateOtp(
          payload.phone,
          payload.otp,
        );

        // Update OTP retry count
        await this.updateOtpRetryCount(payload.phone, otp.retryCount + 1);
      }

      const token: string = await this.authorizationService.sign(
        user.id,
        user.phone,
        user.role,
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

      // Get full user data
      const fullUser: UserEntity = await this.userRepo.findOne({
        where: { id: user.id },
        select: [
          'id',
          'phone',
          'role',
          'name',
          'language',
          'country_code',
          'block',
          'created_at',
          'updated_at',
        ],
      });

      const result = {
        token,
        refreshToken,
        user: fullUser,
      };

      this.logger.log(`User verified successfully: ${user.id}`);
      return { result };
    } catch (error: any) {
      throw new HttpException(
        {
          message: 'The verification process failed.',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async refreshToken(refreshToken: string): Promise<
    SingleResponse<{
      token: string;
      refreshToken: string;
    }>
  > {
    try {
      const user: UserEntity = await this.userRepo.findOne({
        where: { refreshToken },
        select: [
          'id',
          'phone',
          'role',
          'refreshToken',
          'refreshTokenExpiresAt',
        ],
      });

      if (!user) {
        throw new HttpException(
          'Invalid refresh token',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Check if refresh token is expired
      if (
        user.refreshTokenExpiresAt &&
        user.refreshTokenExpiresAt < new Date()
      ) {
        throw new HttpException(
          'Refresh token expired',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Generate new tokens
      const newToken = await this.authorizationService.sign(
        user.id,
        user.phone,
        user.role,
      );

      const newRefreshToken: string = this.generateRefreshToken();
      const newRefreshTokenExpiresAt = new Date(
        Date.now() + this.REFRESH_TOKEN_EXPIRY,
      );

      // Update refresh token in database
      await this.userRepo.update(
        { id: user.id },
        {
          refreshToken: newRefreshToken,
          refreshTokenExpiresAt: newRefreshTokenExpiresAt,
        },
      );

      const result = {
        token: newToken,
        refreshToken: newRefreshToken,
      };

      this.logger.log(`Token refreshed for user: ${user.id}`);
      return { result };
    } catch (error: any) {
      throw new HttpException(
        { message: 'Token refresh failed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async logout(userId: number): Promise<SingleResponse<{ message: string }>> {
    try {
      // Clear refresh token
      await this.userRepo.update(
        { id: userId },
        {
          refreshToken: null,
          refreshTokenExpiresAt: null,
        },
      );

      this.logger.log(`User logged out: ${userId}`);
      return { result: { message: 'Logged out successfully' } };
    } catch (error: any) {
      throw new HttpException(
        { message: 'Logout failed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

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

  async resendOtp(
    payload: AuthResendOtpDto,
  ): Promise<SingleResponse<{ message: string }>> {
    try {
      // Check if phone is blocked
      await this.checkPhoneBlocked(payload.phone);

      // Check if user exists
      const user: UserEntity = await this.userRepo.findOne({
        where: { phone: payload.phone },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Check resend cooldown
      const existingOtp: OtpEntity = await this.otpRepo.findOne({
        where: { phone: payload.phone },
      });

      if (existingOtp) {
        const timeSinceLastSend: number =
          Date.now() - existingOtp.otpSendAt.getTime();
        if (timeSinceLastSend < this.RESEND_COOLDOWN) {
          const remainingTime: number = Math.ceil(
            (this.RESEND_COOLDOWN - timeSinceLastSend) / 1000,
          );
          throw new HttpException(
            `Before requesting a new verification code ${remainingTime} wait a second`,
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }

      // Generate and send new OTP
      await this.handleOtpCreation(payload.phone);

      this.logger.log(`OTP resent to phone: ${payload.phone}`);
      return {
        result: { message: 'Verification code sent successfully' },
      };
    } catch (error) {
      throw new HttpException(
        { message: 'Resend OTP failed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getOtpStatus(
    phone: string,
  ): Promise<SingleResponse<{ remainingTime: number; canResend: boolean }>> {
    try {
      const otp: OtpEntity = await this.otpRepo.findOne({
        where: { phone: phone },
      });

      if (!otp) {
        return {
          result: {
            remainingTime: 0,
            canResend: true,
          },
        };
      }

      const now: number = Date.now();
      const otpSentTime: number = otp.otpSendAt.getTime();
      const expiryTime: number = otpSentTime + this.OTP_EXPIRY_TIME;
      const resendCooldownTime: number = otpSentTime + this.RESEND_COOLDOWN;

      const remainingTime: number = Math.max(
        0,
        Math.ceil((expiryTime - now) / 1000),
      );
      const canResend: boolean = now >= resendCooldownTime;

      return {
        result: {
          remainingTime,
          canResend,
        },
      };
    } catch (error: any) {
      throw new HttpException(
        { message: 'Failed to get OTP status', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async createNewUser(
    phone: string,
    phone_ext: string,
    password: string,
  ): Promise<UserEntity> {
    const newUser: UserEntity = this.userRepo.create({
      role: UserRoleEnum.CLIENT,
      phone,
      language: language.UZ,
      phone_ext: phone_ext,
      password: password,
    });

    return await this.userRepo.save(newUser);
  }

  private async handleOtpCreation(phone: string): Promise<void> {
    const existingOtp: OtpEntity = await this.otpRepo.findOne({
      where: { phone },
    });

    const otp: string = this.generateOtp();
    const otpData = {
      phone,
      otp,
      otpSendAt: new Date(),
      retryCount: existingOtp ? existingOtp.retryCount + 1 : 1,
      attempts: 0,
      blockedUntil: null,
      verified: false,
    };

    if (existingOtp) {
      await this.otpRepo.update({ phone }, otpData);
    } else {
      await this.otpRepo.save(otpData);
    }
  }

  private generateOtp(): string {
    return Math.floor(
      this.OTP_MIN + Math.random() * (this.OTP_MAX - this.OTP_MIN + 1),
    ).toString();
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async validateOtp(
    phone: string,
    otpCode: string,
  ): Promise<OtpEntity> {
    const otp: OtpEntity = await this.otpRepo.findOne({
      where: { phone },
    });

    if (!otp) {
      throw new HttpException(
        'Verification code not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if phone is blocked
    if (otp.blockedUntil && otp.blockedUntil > new Date()) {
      throw new HttpException(
        'The phone number is temporarily blocked. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Check if OTP is expired
    const otpExpiryTime = new Date(Date.now() - this.OTP_EXPIRY_TIME);
    if (otp.otpSendAt < otpExpiryTime) {
      throw new HttpException(
        'Verification code has expired.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Check if OTP is correct
    if (otp.otp !== otpCode) {
      // Increment attempts
      const newAttempts = otp.attempts + 1;

      if (newAttempts >= this.MAX_ATTEMPTS) {
        // Block the phone number
        await this.otpRepo.update(
          { phone },
          {
            attempts: newAttempts,
            blockedUntil: new Date(Date.now() + this.BLOCK_DURATION),
          },
        );
        throw new HttpException(
          'Too many incorrect attempts. The phone number has been blocked for 15 minutes.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      } else {
        // Just increment attempts
        await this.otpRepo.update({ phone }, { attempts: newAttempts });
        throw new HttpException(
          `Invalid verification code. ${this.MAX_ATTEMPTS - newAttempts} There are only a few attempts left.`,
          HttpStatus.UNAUTHORIZED,
        );
      }
    }

    // Mark as verified
    await this.otpRepo.update({ phone }, { verified: true });

    return otp;
  }

  private async findUserByPhone(phone: string): Promise<UserEntity> {
    const user: UserEntity = await this.userRepo.findOne({
      where: { phone },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  private async findContactByID(id: number): Promise<ContactEntity> {
    const contact: ContactEntity = await this.contactRepo.findOne({
      where: { id },
    });

    if (!contact) {
      throw new HttpException('Contact not found', HttpStatus.NOT_FOUND);
    }

    return contact;
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

  private async updateOtpRetryCount(
    phone: string,
    retryCount: number,
  ): Promise<void> {
    await this.otpRepo.update({ phone }, { retryCount });
  }

  private async checkPhoneBlocked(phone: string): Promise<void> {
    const otp: OtpEntity = await this.otpRepo.findOne({
      where: { phone },
    });

    if (otp && otp.blockedUntil && otp.blockedUntil > new Date()) {
      const remainingTime: number = Math.ceil(
        (otp.blockedUntil.getTime() - Date.now()) / 1000 / 60,
      );
      throw new HttpException(
        `Phone number is blocked. Try again in ${remainingTime} minutes.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
