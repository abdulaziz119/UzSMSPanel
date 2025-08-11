import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { JWT_SECRET } from './env/env';

dotenv.config();

@Injectable()
export class AuthorizationService {
  constructor() {}

  async sign(
    id: number,
    phone: string,
    role: string,
    login?: string,
  ): Promise<string> {
    if (!id) {
      throw new HttpException(
        'Id, phone and phone are required',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const data = {
      id: id,
      phone: phone,
      role: role,
      login: login,
    };
    const token = jwt.sign(data, JWT_SECRET, { expiresIn: '1d' });
    return token;
  }
}
