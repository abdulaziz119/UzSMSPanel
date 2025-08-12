import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../../database/database.module';
import { ContactController } from './contact.controller';
import { contactProviders } from '../../../../providers/contact.providers';
import { ContactService } from '../../../../service/contact.service';
import { userProviders } from '../../../../providers/user.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [ContactController],
  providers: [...contactProviders, ...userProviders, ContactService],
})
export class ContactModule {}
