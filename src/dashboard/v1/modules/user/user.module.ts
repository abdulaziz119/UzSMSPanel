import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from '../../../../service/user.service';
import { DatabaseModule } from '../../../../database/database.module';
import { userProviders } from '../../../../providers/user.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [...userProviders, UserService],
})
export class UserDashboardModule {}
