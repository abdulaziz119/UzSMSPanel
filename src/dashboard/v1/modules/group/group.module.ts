import { Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupService } from '../../../../service/group.service';
import { DatabaseModule } from '../../../../database/database.module';
import { groupProviders } from '../../../../providers/group.providers';
import { userProviders } from '../../../../providers/user.providers';
import { contactProviders } from '../../../../providers/contact.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [GroupController],
  providers: [
    ...groupProviders,
    ...userProviders,
    ...contactProviders,
    GroupService,
  ],
})
export class GroupDashboardModule {}
