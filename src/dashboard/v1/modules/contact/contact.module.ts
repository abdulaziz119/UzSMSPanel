import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from '../../../../service/contact.service';
import { DatabaseModule } from '../../../../database/database.module';
import { contactProviders } from '../../../../providers/contact.providers';
import { userProviders } from '../../../../providers/user.providers';
import { smsGroupProviders } from '../../../../providers/sms-group.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [ContactController],
  providers: [
    ...contactProviders,
    ...userProviders,
    ...smsGroupProviders,
    ContactService,
  ],
})
export class ContactDashboardModule {}
