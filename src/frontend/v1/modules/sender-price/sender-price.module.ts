import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../../database/database.module';
import { senderPriceProviders } from '../../../../providers/sender-price.providers';
import { SenderPriceService } from '../../../../service/sender-price.service';
import { SenderPriceController } from './sender-price.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [SenderPriceController],
  providers: [SenderPriceService, ...senderPriceProviders],
  exports: [SenderPriceService],
})
export class SenderPriceModule {}
