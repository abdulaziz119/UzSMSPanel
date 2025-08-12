import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { AuthModule } from './auth/auth.module';
import { ContactModule } from './contact/contact.module';
import { FileModule } from './file/file.module';
import { UserModule } from './user/user.module';
import { SmsGroupModule } from './sms-group/sms-group.module';
import { SmsContactModule } from './sms-contact/sms-contact.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ContactModule,
    FileModule,
    UserModule,
    SmsGroupModule,
    SmsContactModule,
  ],
})
export class ModulesFrontendModule {}
