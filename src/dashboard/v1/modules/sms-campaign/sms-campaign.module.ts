import { Module } from '@nestjs/common';
import { SmsCampaignController } from './sms-campaign.controller';
import { SmsCampaignService } from '../../../../service/sms-campaign.service';
import { DatabaseModule } from '../../../../database/database.module';
import { smsCampaignProviders } from '../../../../providers/sms-campaign.providers';
import { smsMessageProviders } from '../../../../providers/sms-message.providers';
import { userProviders } from '../../../../providers/user.providers';
import { smsGroupProviders } from '../../../../providers/sms-group.providers';
import { contactProviders } from '../../../../providers/contact.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [SmsCampaignController],
  providers: [
    ...smsCampaignProviders,
    ...smsMessageProviders,
    ...userProviders,
    ...smsGroupProviders,
    ...contactProviders,
    SmsCampaignService,
  ],
})
export class SmsCampaignDashboardModule {}