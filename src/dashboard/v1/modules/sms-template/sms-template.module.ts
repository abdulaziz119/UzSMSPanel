import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../../database/database.module';
import { SmsTemplateDashboardController } from './sms-template.controller';
import { SmsTemplateService } from '../../../../service/sms-template.service';
import { smsTemplateProviders } from '../../../../providers/sms-template.providers';

@Module({
	imports: [DatabaseModule],
	controllers: [SmsTemplateDashboardController],
	providers: [...smsTemplateProviders, SmsTemplateService],
})
export class SmsTemplateDashboardModule {}
