import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../../database/database.module';
import { GroupController } from './group.controller';
import { GroupService } from '../../../../service/group.service';
import { groupProviders } from '../../../../providers/group.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [GroupController],
  providers: [...groupProviders, GroupService],
})
export class GroupModule {}
