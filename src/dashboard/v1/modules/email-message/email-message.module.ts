import { Module } from '@nestjs/common';
import { EmailMessageDashboardController } from './email-message.controller';
import { EmailMessageService } from '../../../../service/email-message.service';
import { EmailSmtpService } from '../../../../service/email-smtp.service';
import { EmailTemplateService } from '../../../../service/email-template.service';
import { EmailContactService } from '../../../../service/email-contact.service';
import { EmailGroupService } from '../../../../service/email-group.service';
import { DatabaseModule } from '../../../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { emailContactProviders } from '../../../../providers/email-contact.providers';
import { contactProviders } from '../../../../providers/contact.providers';
import { emailTemplateProviders } from '../../../../providers/email-template.providers';
import { emailMessageProviders } from '../../../../providers/email-message.providers';
import { emailSmtpProviders } from '../../../../providers/email-smtp.providers';
import { emailGroupProviders } from '../../../../providers/email-group.providers';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
  ],
  controllers: [EmailMessageDashboardController],
  providers: [
    EmailMessageService,
    EmailSmtpService,
    EmailTemplateService,
    EmailContactService,
    EmailGroupService,
    ...emailContactProviders,
    ...contactProviders,
    ...emailTemplateProviders,
    ...emailMessageProviders,
    ...emailSmtpProviders,
    ...emailGroupProviders,
  ],
  exports: [EmailMessageService],
})
export class EmailMessageDashboardModule {}
