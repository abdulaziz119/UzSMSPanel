import {
  Controller,
  Get,
  Post,
  Query,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiBadRequestResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { TariffsService } from '../../../../service/tariffs.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SingleResponse } from '../../../../utils/dto/dto';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { TariffEntity } from '../../../../entity/tariffs.entity';
import {
  TariffQueryDto,
  CalculatePriceDto,
} from './dto/tariffs.dto';

@ApiTags('Tariffs')
@ApiBearerAuth()
@Controller({ path: 'tariffs', version: '1' })
export class TariffsController {
  constructor(private readonly tariffsService: TariffsService) {}

  @ApiOperation({ summary: 'Get all tariffs' })
  @ApiResponse({ status: 200, description: 'Tariffs retrieved successfully' })
  @Get()
  @Auth(true) // Optional auth
  async getAllTariffs(
    @Query() query: TariffQueryDto,
  ): Promise<PaginationResponse<TariffEntity[]>> {
    return this.tariffsService.getAllTariffs(
      query.page,
      query.limit,
      {
        operator: query.operator,
        min_price: query.min_price,
        max_price: query.max_price,
        currency: query.currency,
      },
    );
  }

  @ApiOperation({ summary: 'Get available operators' })
  @ApiResponse({ status: 200, description: 'Operators retrieved successfully' })
  @Get('operators')
  @Auth(true) // Optional auth
  async getAvailableOperators(): Promise<SingleResponse<string[]>> {
    return this.tariffsService.getAvailableOperators();
  }

  @ApiOperation({ summary: 'Get cheapest tariff' })
  @ApiResponse({ status: 200, description: 'Cheapest tariff retrieved successfully' })
  @Get('cheapest')
  @Auth(true) // Optional auth
  async getCheapestTariff(): Promise<SingleResponse<TariffEntity | null>> {
    return this.tariffsService.getCheapestTariff();
  }

  @ApiOperation({ summary: 'Calculate SMS price' })
  @ApiResponse({ status: 200, description: 'SMS price calculated successfully' })
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

  @ApiOperation({ summary: 'Get tariff statistics' })
  @ApiResponse({ status: 200, description: 'Tariff statistics retrieved successfully' })
  @Get('statistics/overview')
  @Auth(true) // Optional auth
  async getTariffStatistics(): Promise<SingleResponse<{
    total_tariffs: number;
    average_price: number;
    min_price: number;
    max_price: number;
    operators_count: number;
  }>> {
    return this.tariffsService.getTariffStatistics();
  }
}
