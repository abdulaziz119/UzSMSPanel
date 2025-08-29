import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from '../../../../service/contact.service';
import { DatabaseModule } from '../../../../database/database.module';
import { contactProviders } from '../../../../providers/contact.providers';
import { userProviders } from '../../../../providers/user.providers';
import { groupProviders } from '../../../../providers/group.providers';
import { AxiosModule } from '../../../../helpers/axios.module';

@Module({
  imports: [DatabaseModule, AxiosModule],
  controllers: [ContactController],
  providers: [
    ...contactProviders,
    ...userProviders,
    ...groupProviders,
    ContactService,
  ],
})
export class ContactDashboardModule {}
