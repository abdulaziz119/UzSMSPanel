import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { AuthModule } from './auth/auth.module';
import { ContactModule } from './contact/contact.module';
import { UserModule } from './user/user.module';
import { GroupModule } from './group/group.module';
import { SmsContactModule } from './sms-contact/sms-contact.module';
import { SmsTemplateModule } from './sms-template/sms-template.module';
import { SmsSenderModule } from './sms-sender/sms-sender.module';
import { SenderPriceModule } from './sender-price/sender-price.module';
import { SmsMessageModule } from './sms-message/sms-message.module';
import { TransactionModule } from './transaction/transaction.module';
import { TariffsFrontendModule } from './tariffs/tariffs.module';
import { MessagesModule } from './messages/messages.module';
import { FileModule } from './file/file.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ContactModule,
    UserModule,
    GroupModule,
    SmsContactModule,
    SmsTemplateModule,
    SmsSenderModule,
    SenderPriceModule,
    MessagesModule,
    SmsMessageModule,
    TransactionModule,
    TariffsFrontendModule,
    FileModule,
  ],
})
export class ModulesFrontendModule {}
