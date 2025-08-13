import { Module } from '@nestjs/common';
import { SmsPriceController } from './sms-price.controller';
import { SmsPriceService } from '../../../../service/sms-price.service';
import { DatabaseModule } from '../../../../database/database.module';
import { smsPriceProviders } from '../../../../providers/sms-price.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [SmsPriceController],
  providers: [
    ...smsPriceProviders,
    SmsPriceService,
  ],
})
export class SmsPriceDashboardModule {}
