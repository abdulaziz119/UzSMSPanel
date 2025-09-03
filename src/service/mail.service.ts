import * as nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';
import { SMTP_PASS, SMTP_USER } from '../utils/env/env';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  async sendOtpEmail(email: string, otp: string): Promise<void> {
    const mailOptions = {
      from: SMTP_USER,
      to: email,
      subject: 'UzSMSPanel - Tasdiqlash kodi',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">UzSMSPanel</h2>
          <h3 style="color: #555;">Tasdiqlash kodi</h3>
          <p style="font-size: 16px; color: #666;">
            Hurmatli foydalanuvchi, 
          </p>
          <p style="font-size: 16px; color: #666;">
            Hisobingizga kirish uchun quyidagi tasdiqlash kodini kiriting:
          </p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
          </div>
          <p style="font-size: 14px; color: #999;">
            Bu kod 2 daqiqa davomida amal qiladi. Agar siz bu kodni so'ramagan bo'lsangiz, 
            ushbu xabarni e'tiborsiz qoldiring.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            © 2024 UzSMSPanel. Barcha huquqlar himoyalangan.
          </p>
        </div>
      `,
      text: `UzSMSPanel - Tasdiqlash kodi: ${otp}. Bu kod 2 daqiqa davomida amal qiladi.`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      throw new Error('Failed to send OTP email');
    }
  }
}
