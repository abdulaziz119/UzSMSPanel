import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { AuthModule } from './auth/auth.module';
import { ContactModule } from './contact/contact.module';

@Module({
  imports: [DatabaseModule, AuthModule, ContactModule],
})
export class ModulesFrontendModule {}
