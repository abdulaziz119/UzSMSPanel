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
import { SmsCampaignModule } from './sms-campaign/sms-campaign.module';
import { SmsMessageModule } from './sms-message/sms-message.module';
import { TransactionModule } from './transaction/transaction.module';
import { TariffsFrontendModule } from './tariffs/tariffs.module';
import { MessagesModule } from './messages/messages.module';

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
    // SmsCampaignModule,
    // SmsMessageModule,
    TransactionModule,
    TariffsFrontendModule,
  ],
})
export class ModulesFrontendModule {}
