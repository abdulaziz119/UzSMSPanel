import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../../database/database.module';
import { ContactController } from './contact.controller';
import { contactProviders } from '../../../../providers/contact.providers';
import { ContactService } from '../../../../service/contact.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ContactController],
  providers: [...contactProviders, ContactService],
})
export class ContactModule {}
