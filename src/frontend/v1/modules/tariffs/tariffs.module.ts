import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../../database/database.module';
import { TariffsController } from './tariffs.controller';
import { TariffsService } from '../../../../service/tariffs.service';
import { tariffsProviders } from '../../../../providers/tariffs.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [TariffsController],
  providers: [
    ...tariffsProviders,
    TariffsService,
  ],
  exports: [TariffsService],
})
export class TariffsModule {}
