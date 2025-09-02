import { Module } from '@nestjs/common';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from '../../../../service/statistics.service';
import { DatabaseModule } from '../../../../database/database.module';
import { userProviders } from '../../../../providers/user.providers';
import { messageProviders } from '../../../../providers/message.providers';
import { transactionProviders } from '../../../../providers/transaction.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [StatisticsController],
  providers: [
    ...userProviders,
    ...messageProviders,
    ...transactionProviders,
    StatisticsService,
  ],
})
export class StatisticsModule {}
