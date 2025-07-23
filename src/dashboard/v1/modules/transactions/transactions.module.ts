import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../../database/database.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from '../../../../service/transactions.service';
import { transactionsProviders } from '../../../../providers/transactions.providers';
import { userProviders } from '../../../../providers/user.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [TransactionsController],
  providers: [
    ...transactionsProviders,
    ...userProviders,
    TransactionsService,
  ],
  exports: [TransactionsService],
})
export class TransactionsModule {}
