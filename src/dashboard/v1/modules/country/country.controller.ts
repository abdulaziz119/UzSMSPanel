import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SingleResponse, ParamIdDto } from '../../../../utils/dto/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { CountryEntity } from '../../../../entity/country.entity';
import { CountryService } from '../../../../service/country.service';
import {
  CreateCountryDto,
  UpdateCountryDto,
  CountryFilterDto,
} from '../../../../utils/dto/country.dto';
import { PaginationResponse } from '../../../../utils/pagination.response';

@ApiBearerAuth()
@ApiTags('dashboard-country')
@Controller({ path: '/dashboard/country', version: '1' })
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Post('/create')
  @HttpCode(201)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth(false)
  async create(
    @Body() body: CreateCountryDto,
  ): Promise<SingleResponse<CountryEntity>> {
    return await this.countryService.create(body);
  }

  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth(false)
  async findAll(
    @Body() query: CountryFilterDto,
  ): Promise<PaginationResponse<CountryEntity[]>> {
    return await this.countryService.findAll(query);
  }

  @Post('/findOne')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth(false)
  async findOne(
    @Body() param: ParamIdDto,
  ): Promise<SingleResponse<CountryEntity>> {
    return await this.countryService.findOne(param);
  }

  @Post('/update')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth(false)
  async update(
    @Body() body: UpdateCountryDto,
  ): Promise<SingleResponse<CountryEntity>> {
    return await this.countryService.update(body);
  }

  @Post('/delete')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth(false)
  async delete(@Body() param: ParamIdDto): Promise<{ result: true }> {
    return await this.countryService.delete(param);
  }
}
