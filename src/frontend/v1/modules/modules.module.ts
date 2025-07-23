import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { SmsMessagesModule } from './sms-messages/sms-messages.module';
import { MessageTemplatesModule } from './message-templates/message-templates.module';
import { TariffsModule } from './tariffs/tariffs.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UserModule,
    SmsMessagesModule,
    MessageTemplatesModule,
    TariffsModule,
    TransactionsModule,
  ],
})
export class ModulesFrontendModule {}
