import { Module } from '@nestjs/common';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from '../../../../service/statistics.service';
import { DatabaseModule } from '../../../../database/database.module';
import { userProviders } from '../../../../providers/user.providers';
import { smsGroupProviders } from '../../../../providers/sms-group.providers';
import { smsMessageProviders } from '../../../../providers/sms-message.providers';
import { transactionProviders } from '../../../../providers/transaction.providers';
import { smsContactProviders } from '../../../../providers/sms-contact.providers';
import { smsCampaignProviders } from '../../../../providers/sms-campaign.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [StatisticsController],
  providers: [
    ...userProviders,
    ...smsMessageProviders,
    ...transactionProviders,
    ...smsCampaignProviders,
    StatisticsService,
  ],
})
export class StatisticsModule {}
