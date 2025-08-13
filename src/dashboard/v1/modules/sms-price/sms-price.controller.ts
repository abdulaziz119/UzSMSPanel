import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SingleResponse, ParamIdDto } from '../../../../utils/dto/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { SmsPriceService } from '../../../../service/sms-price.service';
import { SmsPriceEntity } from '../../../../entity/sms-price.entity';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { MessageTypeEnum, OperatorEnum } from '../../../../utils/enum/sms-price.enum';

@ApiBearerAuth()
@ApiTags('dashboard-sms-price')
@Controller({ path: '/dashboard/sms-price', version: '1' })
export class SmsPriceController {
  constructor(private readonly smsPriceService: SmsPriceService) {}

  /**
   * SMS narxlar ro'yxati (filter + pagination)
   */
  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async findAllPrices(
    @Body() filters: any,
  ): Promise<PaginationResponse<SmsPriceEntity[]>> {
    return await this.smsPriceService.findAllPrices(filters);
  }

  /**
   * Yangi SMS narx yozuvi yaratish
   */
  @Post('/create')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async createPrice(
    @Body() body: {
      operator: OperatorEnum;
      message_type: MessageTypeEnum;
      price_per_sms: number;
      description?: string;
    },
  ): Promise<SingleResponse<SmsPriceEntity>> {
    return await this.smsPriceService.createPrice(body);
  }

  /**
   * SMS narx yozuvini yangilash
   */
  @Post('/update')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async updatePrice(
    @Body() body: {
      id: number;
      price_per_sms?: number;
      description?: string;
      is_active?: boolean;
    },
  ): Promise<SingleResponse<SmsPriceEntity>> {
    return await this.smsPriceService.updatePrice(body);
  }

  /**
   * SMS narx yozuvini o'chirish (ID bo'yicha)
   */
  @Post('/delete')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async deletePrice(
    @Body() param: ParamIdDto,
  ): Promise<SingleResponse<{ message: string }>> {
    return await this.smsPriceService.deletePrice(param.id);
  }

  /**
   * Narxlarni ommaviy yangilash
   */
  @Post('/bulk-update')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async bulkUpdatePrices(
    @Body() body: {
      updates: Array<{
        id: number;
        price_per_sms?: number;
        is_active?: boolean;
      }>;
    },
  ): Promise<SingleResponse<{ message: string; updated_count: number }>> {
    return await this.smsPriceService.bulkUpdatePrices(body.updates);
  }
}
