import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SingleResponse, ParamIdDto } from '../../../../utils/dto/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { 
  TariffService,
  TariffFilterDto,
  CreateTariffDto,
  UpdateTariffDto,
} from '../../../../service/tariffs.service';
import { TariffEntity } from '../../../../entity/tariffs.entity';
import { PaginationResponse } from '../../../../utils/pagination.response';

@ApiBearerAuth()
@ApiTags('dashboard-tariffs')
@Controller({ path: '/dashboard/tariffs', version: '1' })
export class TariffsController {
  constructor(private readonly tariffService: TariffService) {}

  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async findAllTariffs(
    @Body() filters: TariffFilterDto,
  ): Promise<PaginationResponse<TariffEntity[]>> {
    return await this.tariffService.findAllTariffs(filters);
  }

  @Post('/create')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async createTariff(
    @Body() body: CreateTariffDto,
  ): Promise<SingleResponse<TariffEntity>> {
    return await this.tariffService.createTariff(body);
  }

  @Post('/update')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async updateTariff(
    @Body() body: UpdateTariffDto,
  ): Promise<SingleResponse<TariffEntity>> {
    return await this.tariffService.updateTariff(body);
  }

  @Post('/delete')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async deleteTariff(
    @Body() param: ParamIdDto,
  ): Promise<SingleResponse<{ message: string }>> {
    return await this.tariffService.deleteTariff(param.id);
  }

  @Post('/details')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getTariffDetails(
    @Body() param: ParamIdDto,
  ): Promise<SingleResponse<TariffEntity>> {
    return await this.tariffService.getTariffDetails(param.id);
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
  async bulkUpdatePrices(
    @Body() body: { 
      operator: string; 
      price_adjustment: number; 
      adjustment_type: 'percent' | 'fixed' 
    },
  ): Promise<SingleResponse<{ message: string; affected_count: number }>> {
    return await this.tariffService.bulkUpdatePrices(body);
  }

  @Post('/toggle-public')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async togglePublic(
    @Body() body: { id: number; public: boolean },
  ): Promise<SingleResponse<TariffEntity>> {
    return await this.tariffService.updateTariff({
      id: body.id,
      public: body.public,
    });
  }

  @Post('/import')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async importTariffs(
    @Body() body: { tariffs: CreateTariffDto[] },
  ): Promise<SingleResponse<{ message: string; imported_count: number; failed_count: number }>> {
    let importedCount = 0;
    let failedCount = 0;

    for (const tariffData of body.tariffs) {
      try {
        await this.tariffService.createTariff(tariffData);
        importedCount++;
      } catch (error) {
        failedCount++;
      }
    }

    return {
      result: {
        message: `Import completed. ${importedCount} imported, ${failedCount} failed`,
        imported_count: importedCount,
        failed_count: failedCount,
      },
    };
  }
}
