import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { AuthorizationService } from '../utils/authorization.service';
import { UserEntity } from '../entity/user.entity';
import {
  AuthLoginDto,
  AuthVerifyDto,
  VerifyOtpDto,
} from '../frontend/v1/modules/auth/dto/dto';
import { SingleResponse } from '../utils/dto/dto';
import { OtpEntity } from 'src/entity/otps.entity';
import {
  DashboardAuthLoginDto,
  DashboardAuthRegisterDto,
} from '../dashboard/v1/modules/auth/dto/dto';
import { language, UserRoleEnum } from '../utils/enum/user.enum';
import * as bcrypt from 'bcryptjs';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly OTP_EXPIRY_TIME = 60000;
  private readonly OTP_MIN = 100000;
  private readonly OTP_MAX = 999999;

  constructor(
    @Inject(MODELS.USER)
    private readonly userRepo: Repository<UserEntity>,
    @Inject(MODELS.OTPS)
    private readonly otpRepo: Repository<OtpEntity>,
    private readonly authorizationService: AuthorizationService,
    private readonly mailService: MailService,
  ) {}

  async login(
    payload: AuthLoginDto,
  ): Promise<SingleResponse<{ user: string }>> {
    try {
      const user: UserEntity = await this.userRepo.findOne({
        where: { email: payload.email },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (!user || !(await bcrypt.compare(payload.password, user.password))) {
        throw new HttpException(
          'Invalid email or password',
          HttpStatus.UNAUTHORIZED,
        );
      }

      await this.handleOtpCreation(payload.email);

      this.logger.log(`OTP sent to email: ${payload.email}`);
      return { result: { user: '60 seconds' } };
    } catch (error: any) {
      throw new HttpException(
        { message: 'Login failed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async verifyOtp(
    payload: VerifyOtpDto,
  ): Promise<SingleResponse<{ user: string }>> {
    try {
      const otp: OtpEntity = await this.otpRepo.findOne({
        where: { email: payload.email },
      });

      await this.createNewUser(payload.email);

      const newOtp = {
        email: payload.email,
        otp: Math.floor(100000 + Math.random() * 900000).toString(),
        otpSendAt: new Date(),
        retryCount: 1,
      };

      if (!otp) {
        await this.otpRepo.save(newOtp);
      } else {
        newOtp.retryCount += otp.retryCount;
        await this.otpRepo.update({ email: payload.email }, newOtp);
      }
      this.mailService
        .sendOtpEmail(payload.email, newOtp.otp)
        .catch((err: any): void =>
          console.error('Failed to send OTP email:', err),
        );

      return { result: { user: '60 seconds' } };
    } catch (error: any) {
      throw new HttpException(
        `Failed to create a user. ${error.message || 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async signVerify(payload: AuthVerifyDto): Promise<
    SingleResponse<{
      id: number;
      role: string;
      token: string;
      email: string;
    }>
  > {
    try {
      const otp: OtpEntity = await this.validateOtp(payload.email, payload.otp);

      const user: UserEntity = await this.findUserByPhone(payload.email);

      const token = await this.authorizationService.sign(
        user.id,
        user.email,
        user.role,
      );

      // Update OTP retry count
      await this.updateOtpRetryCount(payload.email, otp.retryCount + 1);

      const result = {
        token,
        role: user.role,
        id: user.id,
        email: user.email,
      };

      this.logger.log(`User verified successfully: ${user.id}`);
      return { result };
    } catch (error: any) {
      throw new HttpException(
        { message: 'Verification failed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async dashboardLogin(payload: DashboardAuthLoginDto): Promise<
    SingleResponse<{
      id: number;
      role: string;
      token: string;
      email: string;
    }>
  > {
    try {
      const user: UserEntity = await this.findUserByEmail(payload.email);

      const token: string = await this.authorizationService.sign(
        user.id,
        user.email,
        user.role,
      );

      const result = {
        token,
        role: user.role,
        id: user.id,
        email: user.email,
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

  private async createNewUser(email: string): Promise<UserEntity> {
    const newUser: UserEntity = this.userRepo.create({
      role: UserRoleEnum.CLIENT,
      email: email,
      language: language.UZ,
    });

    return await this.userRepo.save(newUser);
  }

  private async handleOtpCreation(email: string): Promise<void> {
    const existingOtp: OtpEntity = await this.otpRepo.findOne({
      where: { email: email },
    });

    const otpData = {
      email: email,
      otp: this.generateOtp(),
      otpSendAt: new Date(),
      retryCount: existingOtp ? existingOtp.retryCount + 1 : 1,
    };

    if (existingOtp) {
      await this.otpRepo.update({ email }, otpData);
    } else {
      await this.otpRepo.save(otpData);
    }
  }

  private generateOtp(): string {
    return Math.floor(
      this.OTP_MIN + Math.random() * (this.OTP_MAX - this.OTP_MIN + 1),
    ).toString();
  }

  private async validateOtp(
    email: string,
    otpCode: string,
  ): Promise<OtpEntity> {
    const otp: OtpEntity = await this.otpRepo.findOne({
      where: { email },
    });

    if (!otp) {
      throw new HttpException('OTP not found', HttpStatus.NOT_FOUND);
    }

    if (otp.otp !== otpCode) {
      throw new HttpException('Invalid OTP', HttpStatus.UNAUTHORIZED);
    }

    const otpExpiryTime = new Date(Date.now() - this.OTP_EXPIRY_TIME);
    if (otp.otpSendAt < otpExpiryTime) {
      throw new HttpException('OTP expired', HttpStatus.UNAUTHORIZED);
    }

    return otp;
  }

  private async findUserByPhone(email: string): Promise<UserEntity> {
    const user: UserEntity = await this.userRepo.findOne({
      where: { email },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user;
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

  private async updateOtpRetryCount(
    email: string,
    retryCount: number,
  ): Promise<void> {
    await this.otpRepo.update({ email }, { retryCount });
  }
}
