import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../../database/database.module';
import { SmsPriceFrontendController } from './sms-price.controller';
import { SmsPriceService } from '../../../../service/sms-price.service';
import { smsPriceProviders } from '../../../../providers/sms-price.providers';

@Module({
	imports: [DatabaseModule],
	controllers: [SmsPriceFrontendController],
	providers: [...smsPriceProviders, SmsPriceService],
})
export class SmsPriceFrontendModule {}
