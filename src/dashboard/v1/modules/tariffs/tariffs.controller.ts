import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiBadRequestResponse,
  ApiBody,
} from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SingleResponse, ParamIdDto } from '../../../../utils/dto/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { TariffEntity } from '../../../../entity/tariffs.entity';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { TariffService } from '../../../../service/tariffs.service';
import {
  CreateTariffDto,
  TariffFilterDto,
  UpdateTariffDto,
  BulkUpdateTariffPricesDto,
} from '../../../../utils/dto/tariffs.dto';

@ApiBearerAuth()
@ApiTags('tariffs')
@Controller({ path: '/dashboard/tariffs', version: '1' })
export class TariffsController {
  constructor(private readonly tariffService: TariffService) {}

  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async findAll(
    @Body() filters: TariffFilterDto,
  ): Promise<PaginationResponse<TariffEntity[]>> {
    return await this.tariffService.findAll(filters);
  }

  @Post('/create')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async create(
    @Body() body: CreateTariffDto,
  ): Promise<SingleResponse<TariffEntity>> {
    return await this.tariffService.create(body);
  }

  @Post('/update')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async update(
    @Body() body: UpdateTariffDto,
  ): Promise<SingleResponse<TariffEntity>> {
    return await this.tariffService.update(body);
  }

  @Post('/delete')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async delete(
    @Body() param: ParamIdDto,
  ): Promise<SingleResponse<{ message: string }>> {
    return await this.tariffService.delete(param.id);
  }

  @Post('/statistics')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getTariffStatistics(): Promise<SingleResponse<any>> {
    return await this.tariffService.getTariffStatistics();
  }

  @Post('/bulk-update-prices')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  @ApiBody({ type: BulkUpdateTariffPricesDto })
  async bulkUpdatePrices(
    @Body() body: BulkUpdateTariffPricesDto,
  ): Promise<SingleResponse<{ message: string; affected_count: number }>> {
    return await this.tariffService.bulkUpdatePrices(body);
  }
}
