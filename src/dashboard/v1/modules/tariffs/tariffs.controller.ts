import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
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
} from '../../../../utils/dto/tariffs.dto';

@ApiBearerAuth()
@ApiTags('tariffs')
@Controller({ path: '/dashboard/tariffs', version: '1' })
export class TariffsController {
  constructor(private readonly tariffService: TariffService) {}

  /**
   * Tariflar ro'yxati (filter + pagination)
   */
  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async findAllTariffs(
    @Body() filters: TariffFilterDto,
  ): Promise<PaginationResponse<TariffEntity[]>> {
    return await this.tariffService.findAllTariffs(filters);
  }

  /**
   * Yangi tarif yaratish
   */
  @Post('/create')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async create(
    @Body() body: CreateTariffDto,
  ): Promise<SingleResponse<TariffEntity>> {
    return await this.tariffService.create(body);
  }

  /**
   * Tarifni yangilash
   */
  @Post('/update')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async update(
    @Body() body: UpdateTariffDto,
  ): Promise<SingleResponse<TariffEntity>> {
    return await this.tariffService.update(body);
  }

  /**
   * Tarifni o'chirish (ID bo'yicha)
   */
  @Post('/delete')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async deleteTariff(
    @Body() param: ParamIdDto,
  ): Promise<SingleResponse<{ message: string }>> {
    return await this.tariffService.deleteTariff(param.id);
  }

  /**
   * Bitta tarif tafsilotlari (ID bo'yicha)
   */
  @Post('/details')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getTariffDetails(
    @Body() param: ParamIdDto,
  ): Promise<SingleResponse<TariffEntity>> {
    return await this.tariffService.getTariffDetails(param.id);
  }

  /**
   * Tariflar statistikasi
   */
  @Post('/statistics')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getTariffStatistics(): Promise<SingleResponse<any>> {
    return await this.tariffService.getTariffStatistics();
  }

  /**
   * Operator bo'yicha narxlarni ommaviy yangilash (foiz yoki fixed)
   */
  @Post('/bulk-update-prices')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async bulkUpdatePrices(
    @Body()
    body: {
      operator: string;
      price_adjustment: number;
      adjustment_type: 'percent' | 'fixed';
    },
  ): Promise<SingleResponse<{ message: string; affected_count: number }>> {
    return await this.tariffService.bulkUpdatePrices(body);
  }

  /**
   * Tarifni public/private qilishni almashtirish
   */
  @Post('/toggle-public')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async togglePublic(
    @Body() body: { id: number; public: boolean },
  ): Promise<SingleResponse<TariffEntity>> {
    return await this.tariffService.update({
      id: body.id,
      public: body.public,
    } as any);
  }

  /**
   * Tariflarni ommaviy import qilish
   */
  @Post('/import')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async importTariffs(@Body() body: { tariffs: CreateTariffDto[] }): Promise<
    SingleResponse<{
      message: string;
      imported_count: number;
      failed_count: number;
    }>
  > {
    let importedCount = 0;
    let failedCount = 0;

    for (const tariffData of body.tariffs) {
      try {
        await this.tariffService.create(tariffData);
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
