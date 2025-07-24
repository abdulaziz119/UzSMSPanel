import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { UserEntity } from '../entity/user.entity';
import { PaginationBuilder } from '../utils/pagination.builder';
import { PaginationResponse } from '../utils/pagination.response';
import { SingleResponse } from '../utils/dto/dto';
import { language, UserRoleEnum } from '../utils/enum/user.enum';
import * as bcrypt from 'bcryptjs';
import {
  CreateUserDto,
  UpdateUserDto,
} from '../utils/interfaces/user.interface';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject(MODELS.USER)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async createUser(
    payload: CreateUserDto,
  ): Promise<SingleResponse<UserEntity>> {
    try {
      const existingUser = await this.userRepo.findOne({
        where: { email: payload.email },
      });

      if (existingUser) {
        throw new HttpException('User already exists', HttpStatus.CONFLICT);
      }

      const hashedPassword = payload.password
        ? await bcrypt.hash(payload.password, 10)
        : null;

      const newUser = this.userRepo.create({
        ...payload,
        password: hashedPassword,
        language: payload.language || language.UZ,
        balance: 0,
        block: false,
      });

      const result = await this.userRepo.save(newUser);

      this.logger.log(`New user created: ${result.id}`);
      return { result };
    } catch (error: any) {
      throw new HttpException(
        `Failed to create user: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    role?: UserRoleEnum,
    search?: string,
  ): Promise<PaginationResponse<UserEntity[]>> {
    try {
      const query = this.userRepo.createQueryBuilder('user');

      if (role) {
        query.andWhere('user.role = :role', { role });
      }

      if (search) {
        query.andWhere(
          '(user.name ILIKE :search OR user.email ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      query.orderBy('user.created_at', 'DESC');

      const [users, total] = await query
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return PaginationBuilder.build(users, page, limit, total);
    } catch (error: any) {
      throw new HttpException(
        `Failed to get users: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserById(id: number): Promise<SingleResponse<UserEntity>> {
    try {
      const user: UserEntity = await this.userRepo.findOne({
        where: { id },
        relations: ['smsMessages', 'transactions', 'templates'],
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      return { result: user };
    } catch (error: any) {
      throw new HttpException(
        `Failed to get user: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateUser(
    id: number,
    payload: UpdateUserDto,
  ): Promise<SingleResponse<UserEntity>> {
    try {
      const user: UserEntity = await this.userRepo.findOne({ where: { id } });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (payload.email && payload.email !== user.email) {
        const existingUser = await this.userRepo.findOne({
          where: { email: payload.email },
        });
        if (existingUser) {
          throw new HttpException('Email already exists', HttpStatus.CONFLICT);
        }
      }

      if (payload.password) {
        payload.password = await bcrypt.hash(payload.password, 10);
      }

      Object.assign(user, payload);
      const result: UserEntity = await this.userRepo.save(user);

      this.logger.log(`User updated: ${result.id}`);
      return { result };
    } catch (error: any) {
      throw new HttpException(
        `Failed to update user: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteUser(id: number): Promise<SingleResponse<{ message: string }>> {
    try {
      const user: UserEntity = await this.userRepo.findOne({ where: { id } });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      await this.userRepo.softDelete(id);

      this.logger.log(`User deleted: ${id}`);
      return { result: { message: 'User deleted successfully' } };
    } catch (error: any) {
      throw new HttpException(
        `Failed to delete user: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async blockUser(id: number): Promise<SingleResponse<UserEntity>> {
    try {
      const user: UserEntity = await this.userRepo.findOne({ where: { id } });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      user.block = !user.block;
      const result: UserEntity = await this.userRepo.save(user);

      this.logger.log(`User ${user.block ? 'blocked' : 'unblocked'}: ${id}`);
      return { result };
    } catch (error: any) {
      throw new HttpException(
        `Failed to toggle user block status: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateBalance(
    id: number,
    amount: number,
    operation: 'add' | 'subtract' = 'add',
  ): Promise<SingleResponse<UserEntity>> {
    try {
      const user: UserEntity = await this.userRepo.findOne({ where: { id } });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const currentBalance = user.balance || 0;

      if (operation === 'add') {
        user.balance = currentBalance + amount;
      } else {
        if (currentBalance < amount) {
          throw new HttpException(
            'Insufficient balance',
            HttpStatus.BAD_REQUEST,
          );
        }
        user.balance = currentBalance - amount;
      }

      const result: UserEntity = await this.userRepo.save(user);

      this.logger.log(
        `User balance updated: ${id}, new balance: ${result.balance}`,
      );
      return { result };
    } catch (error: any) {
      throw new HttpException(
        `Failed to update balance: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateLastLogin(
    id: number,
    ip?: string,
  ): Promise<SingleResponse<UserEntity>> {
    try {
      const user: UserEntity = await this.userRepo.findOne({ where: { id } });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      user.last_login_at = new Date();
      if (ip) {
        user.last_login_ip = ip;
      }

      const result: UserEntity = await this.userRepo.save(user);

      this.logger.log(`User last login updated: ${id}`);
      return { result };
    } catch (error: any) {
      throw new HttpException(
        `Failed to update last login: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async checkIpAccess(userId: number, ip: string): Promise<boolean> {
    try {
      const user: UserEntity = await this.userRepo.findOne({
        where: { id: userId },
      });

      if (!user) {
        return false;
      }

      if (!user.allowed_ips) {
        return true;
      }

      const allowedIps = user.allowed_ips.split(',').map((ip) => ip.trim());
      return allowedIps.includes(ip);
    } catch (error: any) {
      this.logger.error(`Failed to check IP access: ${error.message}`);
      return false;
    }
  }
}
