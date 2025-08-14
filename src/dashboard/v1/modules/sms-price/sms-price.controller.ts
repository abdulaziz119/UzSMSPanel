import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SingleResponse, ParamIdDto } from '../../../../utils/dto/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { SmsPriceService } from '../../../../service/sms-price.service';
import { SmsPriceEntity } from '../../../../entity/sms-price.entity';
import { PaginationResponse } from '../../../../utils/pagination.response';
import {
  PriceFilterDto,
  CreatePriceDto,
  UpdatePriceDto,
  BulkUpdatePricesDto,
} from '../../../../utils/dto/sms-price.dto';

@ApiBearerAuth()
@ApiTags('sms-price')
@Controller({ path: '/dashboard/sms-price', version: '1' })
export class SmsPriceController {
  constructor(private readonly smsPriceService: SmsPriceService) {}

  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async findAll(
    @Body() filters: PriceFilterDto,
  ): Promise<PaginationResponse<SmsPriceEntity[]>> {
    return await this.smsPriceService.findAll(filters, true);
  }

  @Post('/create')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async create(
    @Body() body: CreatePriceDto,
  ): Promise<SingleResponse<SmsPriceEntity>> {
    return await this.smsPriceService.create(body);
  }

  @Post('/update')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async update(
    @Body() body: UpdatePriceDto,
  ): Promise<SingleResponse<SmsPriceEntity>> {
    return await this.smsPriceService.update(body);
  }

  @Post('/delete')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async delete(
    @Body() param: ParamIdDto,
  ): Promise<SingleResponse<{ message: string }>> {
    return await this.smsPriceService.delete(param.id);
  }

  @Post('/bulk-update')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async bulkUpdatePrices(
    @Body() body: BulkUpdatePricesDto,
  ): Promise<SingleResponse<{ message: string; updated_count: number }>> {
    return await this.smsPriceService.bulkUpdatePrices(body.updates);
  }
}
