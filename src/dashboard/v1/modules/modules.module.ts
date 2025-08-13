import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { AuthModule } from './auth/auth.module';
import { SmsTemplateDashboardModule } from './sms-template/sms-template.module';
import { UserDashboardModule } from './user/user.module';
import { StatisticsModule } from './statistics/statistics.module';
import { SmsCampaignDashboardModule } from './sms-campaign/sms-campaign.module';
import { SmsMessageDashboardModule } from './sms-message/sms-message.module';
import { TransactionDashboardModule } from './transaction/transaction.module';
import { SmsPriceDashboardModule } from './sms-price/sms-price.module';
import { TariffsDashboardModule } from './tariffs/tariffs.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    SmsTemplateDashboardModule,
    UserDashboardModule,
    StatisticsModule,
    SmsCampaignDashboardModule,
    SmsMessageDashboardModule,
    TransactionDashboardModule,
    SmsPriceDashboardModule,
    TariffsDashboardModule,
  ],
})
export class ModulesDashboardModule {}
