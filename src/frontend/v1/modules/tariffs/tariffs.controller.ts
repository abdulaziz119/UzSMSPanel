import { Body, Controller, HttpCode, Post, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SingleResponse } from '../../../../utils/dto/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { TariffService } from '../../../../service/tariffs.service';
import { TariffEntity } from '../../../../entity/tariffs.entity';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { TariffFilterDto } from '../../../../utils/dto/tariffs.dto';

@ApiBearerAuth()
@ApiTags('tariffs')
@Controller({ path: '/frontend/tariffs', version: '1' })
export class TariffsController {
  constructor(private readonly tariffService: TariffService) {}

  /**
   * Ommaga ochiq tariflarni ko'rish API
   * Barcha foydalanuvchilar ko'rishi mumkin bo'lgan tariflar ro'yxati
   * Registratsiyasiz ham ko'rish mumkin
   */
  @Post('/public')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  async getPublicTariffs(
    @Body() filters: TariffFilterDto,
  ): Promise<PaginationResponse<TariffEntity[]>> {
    return await this.tariffService.getPublicTariffs(filters);
  }

  /**
   * Bitta telefon raqam uchun taxminiy SMS narxini hisoblash
   */
  @Post('/calculate-price')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth()
  async calculatePrice(
    @Body() body: { phone: string },
  ): Promise<SingleResponse<{ tariff: TariffEntity; estimated_cost: number }>> {
    const tariffResult = await this.tariffService.getTariffByPhonePrefix(
      body.phone,
    );

    // Estimate cost for 1 SMS
    const estimatedCost = tariffResult.result.price;

    return {
      result: {
        tariff: tariffResult.result,
        estimated_cost: estimatedCost,
      },
    };
  }

  /**
   * Telefon raqamdan operatorni aniqlash va narxni ko'rsatish
   */
  @Post('/check-operator')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  async checkOperator(
    @Body() body: { phone: string },
  ): Promise<
    SingleResponse<{ operator: string; price: number; phone_ext: string }>
  > {
    const tariffResult = await this.tariffService.getTariffByPhonePrefix(
      body.phone,
    );

    return {
      result: {
        operator: tariffResult.result.operator,
        price: tariffResult.result.price,
        phone_ext: tariffResult.result.phone_ext,
      },
    };
  }

  /**
   * Operatorlar ro'yxatini olish
   */
  @Get('/operators')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  async getOperatorList(): Promise<SingleResponse<string[]>> {
    return await this.tariffService.getOperatorList();
  }

  /**
   * Bir nechta telefon raqamlar uchun umumiy narxni hisoblash (bulk)
   */
  @Post('/bulk-calculate')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth()
  async bulkCalculatePrice(
    @Body() body: { phones: string[]; message_length?: number },
  ): Promise<
    SingleResponse<{
      total_cost: number;
      breakdown: Array<{
        phone: string;
        operator: string;
        price_per_sms: number;
        sms_count: number;
        total_price: number;
      }>;
    }>
  > {
    const messageLength = body.message_length || 160;
    const smsCount = Math.ceil(messageLength / 160);

    const breakdown = [];
    let totalCost = 0;

    for (const phone of body.phones) {
      try {
        const tariffResult =
          await this.tariffService.getTariffByPhonePrefix(phone);
        const phoneTotal = tariffResult.result.price * smsCount;

        breakdown.push({
          phone,
          operator: tariffResult.result.operator,
          price_per_sms: tariffResult.result.price,
          sms_count: smsCount,
          total_price: phoneTotal,
        });

        totalCost += phoneTotal;
      } catch (error) {
        // Skip phones that don't have tariffs
        breakdown.push({
          phone,
          operator: 'Unknown',
          price_per_sms: 0,
          sms_count: 0,
          total_price: 0,
        });
      }
    }

    return {
      result: {
        total_cost: totalCost,
        breakdown,
      },
    };
  }
}
