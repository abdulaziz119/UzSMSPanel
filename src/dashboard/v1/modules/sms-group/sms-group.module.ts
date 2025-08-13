import { Module } from '@nestjs/common';
import { SmsGroupController } from './sms-group.controller';
import { SmsGroupService } from '../../../../service/sms-group.service';
import { DatabaseModule } from '../../../../database/database.module';
import { smsGroupProviders } from '../../../../providers/sms-group.providers';
import { userProviders } from '../../../../providers/user.providers';
import { contactProviders } from '../../../../providers/contact.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [SmsGroupController],
  providers: [
    ...smsGroupProviders,
    ...userProviders,
    ...contactProviders,
    SmsGroupService,
  ],
})
export class SmsGroupDashboardModule {}
