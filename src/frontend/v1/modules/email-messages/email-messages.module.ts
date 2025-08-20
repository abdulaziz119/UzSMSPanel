import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailMessagesController } from './email-messages.controller';
import { EmailMessagesService } from '../../../../service/email-messages.service';
import { EmailMessageService } from '../../../../service/email-message.service';
import { EmailContactService } from '../../../../service/email-contact.service';
import { EmailTemplateService } from '../../../../service/email-template.service';
import { EmailSmtpService } from '../../../../service/email-smtp.service';
import { EmailGroupService } from '../../../../service/email-group.service';
import { EmailMessagesQueue } from '../../../../queue/email-messages.queue';
import { EMAIL_MESSAGE_QUEUE } from '../../../../constants/constants';
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
    BullModule.registerQueue({
      name: EMAIL_MESSAGE_QUEUE,
    }),
  ],
  controllers: [EmailMessagesController],
  providers: [
    EmailMessagesService,
    EmailMessageService,
    EmailContactService,
    EmailTemplateService,
    EmailSmtpService,
    EmailGroupService,
    EmailMessagesQueue,
    ...emailContactProviders,
    ...contactProviders,
    ...emailTemplateProviders,
    ...emailMessageProviders,
    ...emailSmtpProviders,
    ...emailGroupProviders,
  ],
  exports: [EmailMessagesService],
})
export class EmailMessagesModule {}
