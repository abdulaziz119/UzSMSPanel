import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from '../../../../service/transaction.service';
import { DatabaseModule } from '../../../../database/database.module';
import { transactionProviders } from '../../../../providers/transaction.providers';
import { userProviders } from '../../../../providers/user.providers';
import { contactProviders } from '../../../../providers/contact.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [TransactionController],
  providers: [
    ...transactionProviders,
    ...userProviders,
    ...contactProviders,
    TransactionService,
  ],
})
export class TransactionDashboardModule {}