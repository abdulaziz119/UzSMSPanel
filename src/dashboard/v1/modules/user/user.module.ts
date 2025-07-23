import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../../database/database.module';
import { UserController } from './user.controller';
import { UserService } from '../../../../service/user.service';
import { userProviders } from '../../../../providers/user.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [
    ...userProviders,
    UserService,
  ],
  exports: [UserService],
})
export class UserModule {}
