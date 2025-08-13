import { Module } from '@nestjs/common';
import { CountryController } from './country.controller';
import { CountryService } from '../../../../service/country.service';
import { countryProviders } from '../../../../providers/country.providers';

@Module({
  controllers: [CountryController],
  providers: [CountryService, ...countryProviders],
  exports: [CountryService],
})
export class CountryModule {}
