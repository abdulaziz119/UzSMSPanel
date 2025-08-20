import { Module } from '@nestjs/common';
import { EmailContactService } from '../../../../service/email-contact.service';
import { EmailContactController } from './email-contact.controller';
import { emailContactProviders } from '../../../../providers/email-contact.providers';
import { EmailGroupModule } from '../email-group/email-group.module';
import { DatabaseModule } from '../../../../database/database.module';

@Module({
  imports: [DatabaseModule, EmailGroupModule],
  controllers: [EmailContactController],
  providers: [EmailContactService, ...emailContactProviders],
})
export class EmailContactModule {}
