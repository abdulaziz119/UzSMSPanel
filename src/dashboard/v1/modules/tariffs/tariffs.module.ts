import { Module } from '@nestjs/common';
import { TariffsController } from './tariffs.controller';
import { TariffService } from '../../../../service/tariffs.service';
import { DatabaseModule } from '../../../../database/database.module';
import { tariffsProviders } from '../../../../providers/tariffs.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [TariffsController],
  providers: [...tariffsProviders, TariffService],
})
export class TariffsDashboardModule {}