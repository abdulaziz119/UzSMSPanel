import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { JWT_SECRET } from './env/env';

dotenv.config();

@Injectable()
export class AuthorizationService {
  constructor() {}

  async sign(id: number, email: string, role: string): Promise<string> {
    if (!id) {
      throw new HttpException(
        'Id, email and email are required',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const data = {
      id: id,
      phone: email,
      role: role,
    };
    const token = jwt.sign(data, JWT_SECRET, { expiresIn: '1d' });
    return token;
  }
}
