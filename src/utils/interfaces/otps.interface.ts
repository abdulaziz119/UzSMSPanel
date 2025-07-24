export interface CreateOtpDto {
  email: string;
}

export interface VerifyOtpDto {
  email: string;
  otp: string;
}
