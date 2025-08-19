import { Module } from '@nestjs/common';
import { EmailGroupService } from '../../../../service/email-group.service';
import { EmailGroupController } from './email-group.controller';
import { emailGroupProviders } from '../../../../providers/email-group.providers';
import { DatabaseModule } from '../../../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [EmailGroupController],
  providers: [EmailGroupService, ...emailGroupProviders],
  exports: [EmailGroupService],
})
export class EmailGroupModule {}
