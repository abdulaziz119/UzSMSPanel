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
import { MailService } from './mail.service';

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
    private readonly mailService: MailService,
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
        select: [
          'id',
          'phone',
          'phone_ext',
          'password',
          'role',
          'refreshToken',
        ],
      });
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      if (!user || !(await bcrypt.compare(payload.password, user.password))) {
        throw new HttpException('Invalid  password', HttpStatus.UNAUTHORIZED);
      }
      if (user.block) {
        throw new HttpException('User is blocked', HttpStatus.UNAUTHORIZED);
      }
      if (!user.refreshToken) {
        throw new HttpException(
          'incomplete registration',
          HttpStatus.UNAUTHORIZED,
        );
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
      // Validate that either phone or email is provided
      if (!payload.phone && !payload.email) {
        throw new HttpException(
          'Phone or email is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check if phone/email is blocked
      if (payload.phone) {
        await this.checkPhoneBlocked(payload.phone);
      } else if (payload.email) {
        await this.checkEmailBlocked(payload.email);
      }

      // Find or create user
      let user: UserEntity;
      const hashedPassword: string = await bcrypt.hash(payload.password, 10);

      if (payload.phone) {
        user = await this.userRepo.findOne({
          where: { phone: payload.phone, phone_ext: payload.phone_ext },
        });

        if (!user) {
          await this.createNewUser(
            payload.phone,
            payload.phone_ext,
            hashedPassword,
          );
        }
      } else {
        // Handle email-based user creation/finding
        user = await this.userRepo.findOne({
          where: { email: payload.email },
        });

        if (!user) {
          await this.createNewUserByEmail(payload.email, hashedPassword);
        }
      }

      await this.handleOtpCreation(payload.phone, payload.email);

      const contactInfo = payload.phone
        ? `phone: ${payload.phone}`
        : `email: ${payload.email}`;
      this.logger.log(`OTP sent to ${contactInfo}`);
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
      // Validate that either phone or email is provided
      if (!payload.phone && !payload.email) {
        throw new HttpException(
          'Phone or email is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Find user by phone or email
      let user: UserEntity;
      if (payload.phone) {
        user = await this.findUserByPhone(payload.phone);
      } else {
        user = await this.findUserByEmail(payload.email);
      }

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
          payload.otp,
          payload.phone,
          payload.email,
        );

        // Update OTP retry count
        if (payload.phone) {
          await this.updateOtpRetryCount(payload.phone, otp.retryCount + 1);
        } else {
          await this.updateOtpRetryCountByEmail(
            payload.email,
            otp.retryCount + 1,
          );
        }
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
      // Validate that either phone or email is provided
      if (!payload.phone && !payload.email) {
        throw new HttpException(
          'Phone or email is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check if phone/email is blocked
      if (payload.phone) {
        await this.checkPhoneBlocked(payload.phone);
      } else {
        await this.checkEmailBlocked(payload.email);
      }

      // Check if user exists
      let user: UserEntity;
      if (payload.phone) {
        user = await this.userRepo.findOne({
          where: { phone: payload.phone },
        });
      } else {
        user = await this.userRepo.findOne({
          where: { email: payload.email },
        });
      }

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Check resend cooldown
      const whereCondition = payload.phone
        ? { phone: payload.phone }
        : { email: payload.email };
      const existingOtp: OtpEntity = await this.otpRepo.findOne({
        where: whereCondition,
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
      await this.handleOtpCreation(payload.phone, payload.email);

      const contactInfo = payload.phone
        ? `phone: ${payload.phone}`
        : `email: ${payload.email}`;
      this.logger.log(`OTP resent to ${contactInfo}`);
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
      country_code: 'uzb',
    });

    return await this.userRepo.save(newUser);
  }

  private async handleOtpCreation(
    phone?: string,
    email?: string,
  ): Promise<void> {
    if (!phone && !email) {
      throw new HttpException(
        'Phone or email is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const whereCondition = phone ? { phone } : { email };
    const existingOtp: OtpEntity = await this.otpRepo.findOne({
      where: whereCondition,
    });

    const otp: string = this.generateOtp();
    const otpData = {
      phone: phone || null,
      email: email || null,
      otp,
      otpSendAt: new Date(),
      retryCount: existingOtp ? existingOtp.retryCount + 1 : 1,
      attempts: 0,
      blockedUntil: null,
      verified: false,
    };

    if (existingOtp) {
      await this.otpRepo.update(whereCondition, otpData);
    } else {
      await this.otpRepo.save(otpData);
    }

    // Send OTP via email if email is provided
    if (email) {
      try {
        await this.mailService.sendOtpEmail(email, otp);
        this.logger.log(`OTP email sent successfully to: ${email}`);
      } catch (error) {
        this.logger.error(
          `Failed to send OTP email to ${email}:`,
          error.message,
        );
        throw new HttpException(
          'Failed to send OTP email',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    // TODO: Send OTP via SMS if phone is provided
    // SMS sending logic can be added here in the future
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
    otpCode: string,
    phone?: string,
    email?: string,
  ): Promise<OtpEntity> {
    if (!phone && !email) {
      throw new HttpException(
        'Phone or email is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const whereCondition = phone ? { phone } : { email };
    const otp: OtpEntity = await this.otpRepo.findOne({
      where: whereCondition,
    });

    if (!otp) {
      throw new HttpException(
        'Verification code not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if phone/email is blocked
    if (otp.blockedUntil && otp.blockedUntil > new Date()) {
      const contactType = phone ? 'phone number' : 'email address';
      throw new HttpException(
        `The ${contactType} is temporarily blocked. Please try again later.`,
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
        // Block the phone/email
        await this.otpRepo.update(whereCondition, {
          attempts: newAttempts,
          blockedUntil: new Date(Date.now() + this.BLOCK_DURATION),
        });
        const contactType = phone ? 'phone number' : 'email address';
        throw new HttpException(
          `Too many incorrect attempts. The ${contactType} has been blocked for 15 minutes.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      } else {
        // Just increment attempts
        await this.otpRepo.update(whereCondition, { attempts: newAttempts });
        throw new HttpException(
          `Invalid verification code. ${this.MAX_ATTEMPTS - newAttempts} There are only a few attempts left.`,
          HttpStatus.UNAUTHORIZED,
        );
      }
    }

    // Mark as verified
    await this.otpRepo.update(whereCondition, { verified: true });

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

  private async updateOtpRetryCountByEmail(
    email: string,
    retryCount: number,
  ): Promise<void> {
    await this.otpRepo.update({ email }, { retryCount });
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

  private async checkEmailBlocked(email: string): Promise<void> {
    const otp: OtpEntity = await this.otpRepo.findOne({
      where: { email },
    });

    if (otp && otp.blockedUntil && otp.blockedUntil > new Date()) {
      const remainingTime: number = Math.ceil(
        (otp.blockedUntil.getTime() - Date.now()) / 1000 / 60,
      );
      throw new HttpException(
        `Email address is blocked. Try again in ${remainingTime} minutes.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async createNewUserByEmail(
    email: string,
    hashedPassword: string,
  ): Promise<UserEntity> {
    const newUser = this.userRepo.create({
      email,
      password: hashedPassword,
      role: UserRoleEnum.CLIENT,
      language: language.UZ,
      block: false,
    });

    return await this.userRepo.save(newUser);
  }

  private async findUserByEmail(email: string): Promise<UserEntity> {
    const user: UserEntity = await this.userRepo.findOne({
      where: { email },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }
}
