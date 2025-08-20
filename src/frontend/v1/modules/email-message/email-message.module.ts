import { Module } from '@nestjs/common';
import { EmailMessageService } from '../../../../service/email-message.service';
import { EmailMessageController } from './email-message.controller';
import { emailMessageProviders } from '../../../../providers/email-message.providers';
import { EmailSmtpModule } from '../email-smtp/email-smtp.module';
import { EmailTemplateModule } from '../email-template/email-template.module';
import { EmailContactModule } from '../email-contact/email-contact.module';
import { EmailGroupModule } from '../email-group/email-group.module';
import { DatabaseModule } from '../../../../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    EmailSmtpModule,
    EmailTemplateModule,
    EmailContactModule,
    EmailGroupModule,
  ],
  controllers: [EmailMessageController],
  providers: [EmailMessageService, ...emailMessageProviders],
})
export class EmailMessageModule {}
