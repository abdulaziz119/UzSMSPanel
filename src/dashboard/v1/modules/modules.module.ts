import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { AuthModule } from './auth/auth.module';
import { SmsTemplateDashboardModule } from './sms-template/sms-template.module';

@Module({
  imports: [DatabaseModule, AuthModule, SmsTemplateDashboardModule],
})
export class ModulesDashboardModule {}
