import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from '../../../../service/transaction.service';
import { DatabaseModule } from '../../../../database/database.module';
import { transactionProviders } from '../../../../providers/transaction.providers';
import { userProviders } from '../../../../providers/user.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [TransactionController],
  providers: [...transactionProviders, ...userProviders, TransactionService],
})
export class TransactionModule {}
