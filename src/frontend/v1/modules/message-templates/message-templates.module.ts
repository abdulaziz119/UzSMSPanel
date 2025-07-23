import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../../database/database.module';
import { MessageTemplatesController } from './message-templates.controller';
import { MessageTemplatesService } from '../../../../service/message-templates.service';
import { messageTemplatesProviders } from '../../../../providers/message-templates.providers';
import { userProviders } from '../../../../providers/user.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [MessageTemplatesController],
  providers: [
    ...messageTemplatesProviders,
    ...userProviders,
    MessageTemplatesService,
  ],
  exports: [MessageTemplatesService],
})
export class MessageTemplatesModule {}
