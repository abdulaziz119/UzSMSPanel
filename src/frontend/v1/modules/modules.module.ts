import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { AuthModule } from './auth/auth.module';
import { ContactModule } from './contact/contact.module';
import { FileModule } from './file/file.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [DatabaseModule, AuthModule, ContactModule, FileModule, UserModule],
})
export class ModulesFrontendModule {}
