import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
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
    if (!user) {
      throw new HttpException(
        { message: 'User not found' },
        HttpStatus.NOT_FOUND,
      );
    }

    // eski parolni tekshirish
    const isMatch: boolean = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );
    if (!isMatch) {
      throw new HttpException(
        { message: 'Old password is incorrect' },
        HttpStatus.BAD_REQUEST,
      );
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
    if (!user) {
      throw new HttpException(
        { message: 'User not found' },
        HttpStatus.NOT_FOUND,
      );
    }

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
      .where('user.id = :user_id', { user_id })
      .select(['user', 'contacts'])
      .addSelect('user.refreshToken')
      .getOne();

    if (!user) {
      throw new HttpException(
        { message: 'User not found' },
        HttpStatus.NOT_FOUND,
      );
    }

    // Manually filter the fields from the JSON objects
    if (user.contacts) {
      user.contacts = user.contacts.map((contact) => {
        const newContact: any = { id: contact.id };

        if (contact.commonData) {
          newContact.commonData = {
            first_name: contact.commonData.first_name,
            last_name: contact.commonData.last_name,
            gender: contact.commonData.gender,
            birth_place: contact.commonData.birth_place,
            birth_country: contact.commonData.birth_country,
            birth_date: contact.commonData.birth_date,
            nationality: contact.commonData.nationality,
          };
        }

        if (contact.docData) {
          newContact.docData = {
            pass_data: contact.docData.pass_data,
            issued_by: contact.docData.issued_by,
            issued_date: contact.docData.issued_date,
            expiry_date: contact.docData.expiry_date,
            doc_type: contact.docData.doc_type,
          };
        }

        if (contact.address) {
          newContact.address = contact.address.map((addr) => ({
            region: addr.region,
            address: addr.address,
            country: addr.country,
            cadastre: addr.cadastre,
            district: addr.district,
            registration_date: addr.registration_date,
          }));
        }
        return newContact;
      });
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
        throw new HttpException(
          { message: 'User not found' },
          HttpStatus.NOT_FOUND,
        );
      }

      if (user.block) {
        throw new HttpException(
          { message: 'User is already blocked' },
          HttpStatus.NOT_FOUND,
        );
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
        throw new HttpException(
          { message: 'User not found' },
          HttpStatus.NOT_FOUND,
        );
      }

      if (!user.block) {
        throw new HttpException(
          { message: 'User is not blocked' },
          HttpStatus.BAD_REQUEST,
        );
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
        throw new HttpException(
          { message: 'User not found' },
          HttpStatus.NOT_FOUND,
        );
      }

      let newBalance: number;

      switch (payload.operation) {
        case BalanceOperationEnum.ADD:
          newBalance = user.balance + payload.amount;
          break;
        case BalanceOperationEnum.SUBTRACT:
          newBalance = user.balance - payload.amount;
          if (newBalance < 0) {
            throw new HttpException(
              { message: 'Insufficient balance' },
              HttpStatus.BAD_REQUEST,
            );
          }
          break;
        case BalanceOperationEnum.SET:
          newBalance = payload.amount;
          break;
        default:
          throw new HttpException(
            { message: 'Invalid operation' },
            HttpStatus.BAD_REQUEST,
          );
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

      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const newUsersThisMonth: number = await this.userRepo
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
        throw new HttpException(
          { message: 'User not found' },
          HttpStatus.NOT_FOUND,
        );
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
