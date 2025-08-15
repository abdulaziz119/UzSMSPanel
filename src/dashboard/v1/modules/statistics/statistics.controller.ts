import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SingleResponse } from '../../../../utils/dto/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { StatisticsService } from '../../../../service/statistics.service';
import { DashboardStatsFilterDto } from '../../../../utils/dto/statistics.dto';

@ApiBearerAuth()
@ApiTags('statistics')
@Controller({ path: '/dashboard/statistics', version: '1' })
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  /**
   * Dashboard uchun umumiy statistika (grafiklar uchun)
   */
  @Post('/dashboard')
  @HttpCode(200)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getDashboardStatistics(
    @Body() filters?: DashboardStatsFilterDto,
  ): Promise<SingleResponse<any>> {
    return await this.statisticsService.getDashboardStatistics(filters);
  }

  /**
   * SMS bo'yicha hisobotlar (statuslar, sonlar)
   */
  @Post('/sms-reports')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getSmsReports(
    @Body() filters?: DashboardStatsFilterDto,
  ): Promise<SingleResponse<any>> {
    return await this.statisticsService.getSmsReports(filters);
  }

  /**
   * Daromadlar bo'yicha hisobot (oylik, kunlik, davr bo'yicha)
   */
  @Post('/revenue-reports')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getRevenueReports(
    @Body() filters?: DashboardStatsFilterDto,
  ): Promise<SingleResponse<any>> {
    return await this.statisticsService.getRevenueReports(filters);
  }
}
