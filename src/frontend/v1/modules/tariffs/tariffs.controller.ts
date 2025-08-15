import { Body, Controller, HttpCode, Post, Get } from '@nestjs/common';
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

  @Post('/public')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @HttpCode(201)
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async getPublicTariffs(
    @Body() filters: TariffFilterDto,
  ): Promise<PaginationResponse<TariffEntity[]>> {
    return await this.tariffService.getPublicTariffs(filters);
  }

  @Get('/operators')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  async getOperatorList(): Promise<SingleResponse<string[]>> {
    return await this.tariffService.getOperatorList();
  }
}
