import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../../database/database.module';
import { ContactController } from './contact.controller';
import { contactProviders } from '../../../../providers/contact.providers';
import { ContactService } from '../../../../service/contact.service';
import { userProviders } from '../../../../providers/user.providers';
import { AxiosModule } from '../../../../helpers/axios.module';

@Module({
  imports: [DatabaseModule, AxiosModule],
  controllers: [ContactController],
  providers: [...contactProviders, ...userProviders, ContactService],
})
export class ContactModule {}
