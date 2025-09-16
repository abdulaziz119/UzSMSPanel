import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { PaginationParams } from '../../../../utils/dto/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { AxiosService } from '../../../../helpers/axios.service';
import { EXCEL_SERVICE_URL } from '../../../../utils/env/env';

@ApiBearerAuth()
@ApiTags('Excel')
@Controller({ path: '/frontend/excel', version: '1' })
export class ExcelController {
  private url = EXCEL_SERVICE_URL;
  constructor(private readonly axiosService: AxiosService) {}

  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async findAll(@Body() body: PaginationParams) {
    const url = `${this.url}/api/excel/findAll`;
    return await this.axiosService.sendPostFileRequest(url, {
      limit: body.limit,
      page: body.page,
    });
  }
}
