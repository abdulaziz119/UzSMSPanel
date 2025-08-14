import { Module } from '@nestjs/common';
import { CountryController } from './country.controller';
import { CountryService } from '../../../../service/country.service';
import { countryProviders } from '../../../../providers/country.providers';
import { DatabaseModule } from '../../../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CountryController],
  providers: [...countryProviders, CountryService],
})
export class CountryDashboardModule {}
