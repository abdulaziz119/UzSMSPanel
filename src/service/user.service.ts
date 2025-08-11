import { Inject, Injectable } from '@nestjs/common';
import { MODELS } from '../constants/constants';
import { Repository } from 'typeorm';
import { UserEntity } from '../entity/user.entity';

@Injectable()
export class UserService {
  constructor(
    @Inject(MODELS.USER)
    private readonly userRepo: Repository<UserEntity>,
  ) {}
}
