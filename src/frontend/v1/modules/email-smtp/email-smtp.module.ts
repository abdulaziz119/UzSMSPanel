import { Module } from '@nestjs/common';
import { EmailSmtpService } from '../../../../service/email-smtp.service';
import { EmailSmtpController } from './email-smtp.controller';
import { emailSmtpProviders } from '../../../../providers/email-smtp.providers';
import { DatabaseModule } from '../../../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [EmailSmtpController],
  providers: [EmailSmtpService, ...emailSmtpProviders],
})
export class EmailSmtpModule {}
