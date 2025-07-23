import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { OtpEntity } from '../entity/otps.entity';
import { MailService } from './mail.service';

export interface CreateOtpDto {
  email: string;
}

export interface VerifyOtpDto {
  email: string;
  otp: string;
}

@Injectable()
export class OtpsService {
  private readonly logger = new Logger(OtpsService.name);
  private readonly OTP_EXPIRY_TIME = 300000; // 5 minutes
  private readonly OTP_MIN = 100000;
  private readonly OTP_MAX = 999999;
  private readonly MAX_RETRY_COUNT = 5;

  constructor(
    @Inject(MODELS.OTPS)
    private readonly otpRepo: Repository<OtpEntity>,
    private readonly mailService: MailService,
  ) {}

  async generateOtp(payload: CreateOtpDto): Promise<{ message: string }> {
    try {
      const existingOtp = await this.otpRepo.findOne({
        where: { email: payload.email },
      });

      // Agar retry count limit oshgan bo'lsa, xatolik qaytarish
      if (existingOtp && existingOtp.retryCount >= this.MAX_RETRY_COUNT) {
        throw new HttpException(
          'OTP retry limit exceeded. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      const otpCode = this.generateOtpCode();
      const otpData = {
        email: payload.email,
        otp: otpCode,
        otpSendAt: new Date(),
        retryCount: existingOtp ? existingOtp.retryCount + 1 : 1,
      };

      if (existingOtp) {
        await this.otpRepo.update({ email: payload.email }, otpData);
      } else {
        await this.otpRepo.save(otpData);
      }

      // Email orqali OTP jo'natish
      await this.mailService.sendOtpEmail(payload.email, otpCode);

      this.logger.log(`OTP sent to email: ${payload.email}`);
      return { message: 'OTP sent successfully' };
    } catch (error: any) {
      throw new HttpException(
        `Failed to generate OTP: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async verifyOtp(payload: VerifyOtpDto): Promise<{ message: string }> {
    try {
      const otp = await this.otpRepo.findOne({
        where: { email: payload.email },
      });

      if (!otp) {
        throw new HttpException('OTP not found', HttpStatus.NOT_FOUND);
      }

      if (otp.otp !== payload.otp) {
        throw new HttpException('Invalid OTP', HttpStatus.UNAUTHORIZED);
      }

      // OTP muddatini tekshirish
      const otpExpiryTime = new Date(Date.now() - this.OTP_EXPIRY_TIME);
      if (otp.otpSendAt < otpExpiryTime) {
        throw new HttpException('OTP expired', HttpStatus.UNAUTHORIZED);
      }

      // OTP tasdiqlangandan so'ng o'chirish
      await this.otpRepo.delete({ email: payload.email });

      this.logger.log(`OTP verified for email: ${payload.email}`);
      return { message: 'OTP verified successfully' };
    } catch (error: any) {
      throw new HttpException(
        `Failed to verify OTP: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async resendOtp(email: string): Promise<{ message: string }> {
    try {
      return await this.generateOtp({ email });
    } catch (error: any) {
      throw new HttpException(
        `Failed to resend OTP: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteExpiredOtps(): Promise<{ deleted_count: number }> {
    try {
      const expiryDate = new Date(Date.now() - this.OTP_EXPIRY_TIME);
      
      const result = await this.otpRepo
        .createQueryBuilder()
        .delete()
        .from(OtpEntity)
        .where('otpSendAt < :expiryDate', { expiryDate })
        .execute();

      this.logger.log(`Deleted ${result.affected} expired OTPs`);
      return { deleted_count: result.affected || 0 };
    } catch (error: any) {
      throw new HttpException(
        `Failed to delete expired OTPs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getOtpStatus(email: string): Promise<{
    exists: boolean;
    retry_count: number;
    time_remaining?: number;
  }> {
    try {
      const otp = await this.otpRepo.findOne({ where: { email } });

      if (!otp) {
        return {
          exists: false,
          retry_count: 0,
        };
      }

      const timeElapsed = Date.now() - otp.otpSendAt.getTime();
      const timeRemaining = Math.max(0, this.OTP_EXPIRY_TIME - timeElapsed);

      return {
        exists: true,
        retry_count: otp.retryCount,
        time_remaining: timeRemaining,
      };
    } catch (error: any) {
      throw new HttpException(
        `Failed to get OTP status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async clearUserOtp(email: string): Promise<{ message: string }> {
    try {
      const result = await this.otpRepo.delete({ email });

      if (result.affected === 0) {
        throw new HttpException('OTP not found', HttpStatus.NOT_FOUND);
      }

      this.logger.log(`OTP cleared for email: ${email}`);
      return { message: 'OTP cleared successfully' };
    } catch (error: any) {
      throw new HttpException(
        `Failed to clear OTP: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private generateOtpCode(): string {
    return Math.floor(
      this.OTP_MIN + Math.random() * (this.OTP_MAX - this.OTP_MIN + 1),
    ).toString();
  }
}
