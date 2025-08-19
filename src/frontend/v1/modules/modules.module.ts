import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { AuthModule } from './auth/auth.module';
import { ContactModule } from './contact/contact.module';
import { FileModule } from './file/file.module';
import { UserModule } from './user/user.module';
import { SmsGroupModule } from './sms-group/sms-group.module';
import { SmsContactModule } from './sms-contact/sms-contact.module';
import { SmsTemplateModule } from './sms-template/sms-template.module';
import { SmsSenderModule } from './sms-sender/sms-sender.module';
import { SenderPriceModule } from './sender-price/sender-price.module';
import { SmsMessageModule } from './sms-message/sms-message.module';
import { TransactionModule } from './transaction/transaction.module';
import { TariffsFrontendModule } from './tariffs/tariffs.module';
import { MessagesModule } from './messages/messages.module';
import { EmailSmtpModule } from './email-smtp/email-smtp.module';
import { EmailGroupModule } from './email-group/email-group.module';
import { EmailContactModule } from './email-contact/email-contact.module';
import { EmailTemplateModule } from './email-template/email-template.module';
import { EmailMessageModule } from './email-message/email-message.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ContactModule,
    FileModule,
    UserModule,
    SmsGroupModule,
    SmsContactModule,
    SmsTemplateModule,
    SmsSenderModule,
    SenderPriceModule,
    MessagesModule,
    SmsMessageModule,
    TransactionModule,
    TariffsFrontendModule,
    EmailSmtpModule,
    EmailGroupModule,
    EmailContactModule,
    EmailTemplateModule,
    EmailMessageModule,
  ],
})
export class ModulesFrontendModule {}
