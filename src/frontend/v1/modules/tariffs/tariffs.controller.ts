import {
  Controller,
  Get,
  Post,
  Query,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBadRequestResponse } from '@nestjs/swagger';
import { TariffsService } from '../../../../service/tariffs.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SingleResponse } from '../../../../utils/dto/dto';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { TariffEntity } from '../../../../entity/tariffs.entity';
import { TariffQueryDto, CalculatePriceDto } from './dto/tariffs.dto';

@ApiTags('Tariffs')
@ApiBearerAuth()
@Controller({ path: 'tariffs', version: '1' })
export class TariffsController {
  constructor(private readonly tariffsService: TariffsService) {}

  @Get('findAll')
  @Auth(true) // Optional auth
  async getAllTariffs(
    @Query() query: TariffQueryDto,
  ): Promise<PaginationResponse<TariffEntity[]>> {
    return this.tariffsService.getAllTariffs(query.page, query.limit, {
      operator: query.operator,
      min_price: query.min_price,
      max_price: query.max_price,
      currency: query.currency,
    });
  }

  @Get('operators')
  @Auth(true) // Optional auth
  async getAvailableOperators(): Promise<SingleResponse<string[]>> {
    return this.tariffsService.getAvailableOperators();
  }

  @Get('cheapest')
  @Auth(true) // Optional auth
  async getCheapestTariff(): Promise<SingleResponse<TariffEntity | null>> {
    return this.tariffsService.getCheapestTariff();
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Post('calculate-price')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async calculateSmsPrice(
    @Body() calculatePriceDto: CalculatePriceDto,
  ): Promise<SingleResponse<{ total_price: number; operator: string }>> {
    return this.tariffsService.calculateSmsPrice(
      calculatePriceDto.operator,
      calculatePriceDto.sms_count,
    );
  }

  @Get('statistics/overview')
  @Auth(true) // Optional auth
  async getTariffStatistics(): Promise<
    SingleResponse<{
      total_tariffs: number;
      average_price: number;
      min_price: number;
      max_price: number;
      operators_count: number;
    }>
  > {
    return this.tariffsService.getTariffStatistics();
  }
}
