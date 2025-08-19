import { Module } from '@nestjs/common';
import { SenderPriceController } from './sender-price.controller';
import { SenderPriceService } from '../../../../service/sender-price.service';
import { DatabaseModule } from '../../../../database/database.module';
import { senderPriceProviders } from '../../../../providers/sender-price.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [SenderPriceController],
  providers: [SenderPriceService, ...senderPriceProviders],
})
export class SenderPriceModule {}
