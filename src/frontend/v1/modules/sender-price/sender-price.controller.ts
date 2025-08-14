import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBadRequestResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SenderPriceService } from '../../../../service/sender-price.service';
import { PaginationParams } from '../../../../utils/dto/dto';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { SenderPriceEntity } from '../../../../entity/sender-price.entity';

@ApiBearerAuth()
@ApiTags('sender-price')
@Controller({ path: '/frontend/sender-price', version: '1' })
export class SenderPriceController {
  constructor(private readonly service: SenderPriceService) {}

  /**
   * Sender (sender name) uchun narxlar ro'yxati (pagination bilan)
   */
  @Post('/findAll')
  @HttpCode(200)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async findAll(
    @Body() query: PaginationParams,
  ): Promise<PaginationResponse<SenderPriceEntity[]>> {
    return await this.service.findAll(query);
  }
}
