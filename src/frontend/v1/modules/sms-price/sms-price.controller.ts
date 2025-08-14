import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { SmsPriceEntity } from '../../../../entity/sms-price.entity';
import { SmsPriceService } from '../../../../service/sms-price.service';
import { PriceFilterDto } from '../../../../utils/dto/sms-price.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';

@ApiBearerAuth()
@ApiTags('sms-price')
@Controller({ path: '/frontend/sms-price', version: '1' })
export class SmsPriceFrontendController {
  constructor(private readonly smsPriceService: SmsPriceService) {}

  @Post('/findAll')
  @HttpCode(200)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth()
  async findAll(
    @Body() filters: PriceFilterDto,
  ): Promise<PaginationResponse<SmsPriceEntity[]>> {
    return await this.smsPriceService.findAll(filters, false);
  }
}
