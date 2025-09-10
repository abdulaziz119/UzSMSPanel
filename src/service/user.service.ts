import {
  Inject,
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { UserEntity } from '../entity/user.entity';
import { SingleResponse } from '../utils/dto/dto';
import { PaginationResponse } from '../utils/pagination.response';
import { getPaginationResponse } from '../utils/pagination.builder';
import { UserRoleEnum, BalanceOperationEnum } from '../utils/enum/user.enum';
import {
  BlockUserDto,
  ResetPasswordDto,
  UpdatePasswordDto,
  UpdateUserBalanceDto,
} from '../utils/dto/user.dto';
import { UserFilterDto } from '../utils/interfaces/user.interfaces';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @Inject(MODELS.USER)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async getMe(user_id: number): Promise<SingleResponse<UserEntity>> {
    return await this.getUserProfile(user_id);
  }

  async updatePassword(
    user_id: number,
    dto: UpdatePasswordDto,
  ): Promise<SingleResponse<UserEntity>> {
    const user: UserEntity = await this.userRepo.findOne({
      where: { id: user_id },
    });
    if (!user) throw new NotFoundException('User not found');

    // eski parolni tekshirish
    const isMatch: boolean = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );
    if (!isMatch) {
      throw new BadRequestException('Old password is incorrect');
    }

    // yangi parolni hash qilish
    const hashed: string = await bcrypt.hash(dto.newPassword, 10);
    user.password = hashed;
    await this.userRepo.save(user);

    return { result: user };
  }

  async resetPassword(
    user_id: number,
    dto: ResetPasswordDto,
  ): Promise<SingleResponse<UserEntity>> {
    const user: UserEntity = await this.userRepo.findOne({
      where: { id: user_id },
    });
    if (!user) throw new NotFoundException('User not found');

    const hashed: string = await bcrypt.hash(dto.newPassword, 10);
    user.password = hashed;
    await this.userRepo.save(user);

    return { result: user };
  }

  private async getUserProfile(
    user_id: number,
  ): Promise<SingleResponse<UserEntity>> {
    const user: UserEntity = await this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.contacts', 'contacts')
      .leftJoinAndSelect('contacts.address_file', 'address_file')
      .leftJoinAndSelect('contacts.passport_file', 'passport_file')
      .where('user.id = :user_id', { user_id })
      .select([
        'user',
        'contacts',
        'address_file.id',
        'address_file.public_url',
        'passport_file.id',
        'passport_file.public_url',
      ])
      .addSelect('user.refreshToken')
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { result: user };
  }

  // Dashboard methods
  async findAllUsers(
    filters: UserFilterDto,
  ): Promise<PaginationResponse<UserEntity[]>> {
    const { page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    try {
      const queryBuilder = this.userRepo
        .createQueryBuilder('user')
        .select([
          'user.id',
          'user.phone',
          'user.phone_ext',
          'user.name',
          'user.email',
          'user.role',
          'user.balance',
          'user.block',
          'user.lastseen',
          'user.created_at',
          'user.updated_at',
        ])
        .orderBy('user.created_at', 'DESC');

      // Filtrlarni qo'llash
      if (filters.role) {
        queryBuilder.andWhere('user.role = :role', { role: filters.role });
      }

      if (filters.blocked !== undefined) {
        queryBuilder.andWhere('user.block = :blocked', {
          blocked: filters.blocked,
        });
      }

      if (filters.search) {
        queryBuilder.andWhere(
          '(user.phone LIKE :search OR user.name LIKE :search OR user.email LIKE :search)',
          { search: `%${filters.search}%` },
        );
      }

      const [users, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return getPaginationResponse<UserEntity>(users, page, limit, total);
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching users', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async blockUser(
    payload: BlockUserDto,
  ): Promise<SingleResponse<{ message: string }>> {
    try {
      const user: UserEntity = await this.userRepo.findOne({
        where: { id: payload.user_id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.block) {
        throw new BadRequestException('User is already blocked');
      }

      await this.userRepo.update(payload.user_id, {
        block: true,
      });

      return { result: { message: 'User blocked successfully' } };
    } catch (error) {
      throw new HttpException(
        { message: 'Error blocking user', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async unblockUser(
    payload: BlockUserDto,
  ): Promise<SingleResponse<{ message: string }>> {
    try {
      const user: UserEntity = await this.userRepo.findOne({
        where: { id: payload.user_id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.block) {
        throw new BadRequestException('User is not blocked');
      }

      await this.userRepo.update(payload.user_id, {
        block: false,
      });

      return { result: { message: 'User unblocked successfully' } };
    } catch (error) {
      throw new HttpException(
        { message: 'Error unblocking user', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateUserBalance(
    payload: UpdateUserBalanceDto,
  ): Promise<SingleResponse<{ new_balance: number }>> {
    try {
      const user: UserEntity = await this.userRepo.findOne({
        where: { id: payload.user_id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      let newBalance: number;

      switch (payload.operation) {
        case BalanceOperationEnum.ADD:
          newBalance = user.balance + payload.amount;
          break;
        case BalanceOperationEnum.SUBTRACT:
          newBalance = user.balance - payload.amount;
          if (newBalance < 0) {
            throw new BadRequestException('Insufficient balance');
          }
          break;
        case BalanceOperationEnum.SET:
          newBalance = payload.amount;
          break;
        default:
          throw new BadRequestException('Invalid operation');
      }

      await this.userRepo.update(payload.user_id, {
        balance: newBalance,
      });

      return { result: { new_balance: newBalance } };
    } catch (error) {
      throw new HttpException(
        { message: 'Error updating user balance', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserStatistics(): Promise<SingleResponse<any>> {
    try {
      const totalUsers: number = await this.userRepo.count();

      const clientUsers: number = await this.userRepo.count({
        where: { role: UserRoleEnum.CLIENT },
      });

      const blockedUsers: number = await this.userRepo.count({
        where: { block: true },
      });

      const activeUsers: number = await this.userRepo.count({
        where: { block: false },
      });

      // Son 30 kunlik yangi foydalanuvchilar
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const newUsersThisMonth:number = await this.userRepo
        .createQueryBuilder('user')
        .where('user.created_at >= :date', { date: last30Days })
        .getCount();

      const statistics = {
        total_users: totalUsers,
        client_users: clientUsers,
        blocked_users: blockedUsers,
        active_users: activeUsers,
        new_users_this_month: newUsersThisMonth,
      };

      return { result: statistics };
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching user statistics', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserDetails(user_id: number): Promise<SingleResponse<UserEntity>> {
    try {
      const user: UserEntity = await this.userRepo.findOne({
        where: { id: user_id },
        relations: ['contacts', 'smsGroup'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return { result: user };
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching user details', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
