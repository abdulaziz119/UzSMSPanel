import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBadRequestResponse } from '@nestjs/swagger';
import { TariffsService } from '../../../../service/tariffs.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { ParamIdDto, SingleResponse } from '../../../../utils/dto/dto';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { TariffEntity } from '../../../../entity/tariffs.entity';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import {
  CreateTariffDto,
  UpdateTariffDto,
  TariffQueryDto,
} from './dto/tariffs.dto';

@ApiTags('Dashboard - Tariffs')
@ApiBearerAuth()
@Controller({ path: '/dashboard/tariffs', version: '1' })
export class TariffsController {
  constructor(private readonly tariffsService: TariffsService) {}

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Post('/create')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createTariff(
    @Body() createTariffDto: CreateTariffDto,
  ): Promise<SingleResponse<TariffEntity>> {
    return this.tariffsService.createTariff(createTariffDto);
  }

  @Get('findAll')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  @HttpCode(HttpStatus.OK)
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

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Get('/findOne/:id')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  @HttpCode(HttpStatus.OK)
  async getTariffById(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<TariffEntity>> {
    return this.tariffsService.getTariffById(params.id);
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Put('/update/:id')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateTariff(
    @Param() params: ParamIdDto,
    @Body() updateTariffDto: UpdateTariffDto,
  ): Promise<SingleResponse<TariffEntity>> {
    return this.tariffsService.updateTariff(params.id, updateTariffDto);
  }

  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Delete('/delete/:id')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteTariff(
    @Param() params: ParamIdDto,
  ): Promise<SingleResponse<{ message: string }>> {
    return this.tariffsService.deleteTariff(params.id);
  }

  @Get('operators/list')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  @HttpCode(HttpStatus.OK)
  async getAvailableOperators(): Promise<SingleResponse<string[]>> {
    return this.tariffsService.getAvailableOperators();
  }

  @Get('cheapest/get')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  @HttpCode(HttpStatus.OK)
  async getCheapestTariff(): Promise<SingleResponse<TariffEntity | null>> {
    return this.tariffsService.getCheapestTariff();
  }

  @Get('statistics/overview')
  @Auth()
  @Roles(UserRoleEnum.SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.OPERATOR)
  @HttpCode(HttpStatus.OK)
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
