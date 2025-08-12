import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { UserEntity } from '../entity/user.entity';
import { SingleResponse } from '../utils/dto/dto';

@Injectable()
export class UserService {
  constructor(
    @Inject(MODELS.USER)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async getMe(user_id: number): Promise<SingleResponse<UserEntity>> {
    return await this.getUserProfile(user_id);
  }

  private async getUserProfile(
    user_id: number,
  ): Promise<SingleResponse<UserEntity>> {
    const user: UserEntity = await this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.contact', 'contact')
      .leftJoinAndSelect('contact.address_file', 'address_file')
      .leftJoinAndSelect('contact.passport_file', 'passport_file')
      .where('user.id = :user_id', { user_id })
      .select([
        'user',
        'contact',
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
}
