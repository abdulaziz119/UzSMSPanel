import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { AuthModule } from './auth/auth.module';
import { SmsTemplateDashboardModule } from './sms-template/sms-template.module';
import { UserDashboardModule } from './user/user.module';
import { StatisticsModule } from './statistics/statistics.module';
import { SmsMessageDashboardModule } from './message/message.module';
import { TransactionDashboardModule } from './transaction/transaction.module';
import { TariffsDashboardModule } from './tariffs/tariffs.module';
import { CountryDashboardModule } from './country/country.module';
import { SenderPriceModule } from './sender-price/sender-price.module';
import { GroupDashboardModule } from './group/group.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    SmsTemplateDashboardModule,
    UserDashboardModule,
    StatisticsModule,
    SmsMessageDashboardModule,
    TransactionDashboardModule,
    TariffsDashboardModule,
    CountryDashboardModule,
    SenderPriceModule,
    GroupDashboardModule,
  ],
})
export class ModulesDashboardModule {}
