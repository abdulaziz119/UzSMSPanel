import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SingleResponse } from '../../../../utils/dto/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { 
  StatisticsService,
  DashboardStatsFilterDto,
} from '../../../../service/statistics.service';

@ApiBearerAuth()
@ApiTags('dashboard-statistics')
@Controller({ path: '/dashboard/statistics', version: '1' })
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

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

  @Post('/sms-reports')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getSmsReports(
    @Body() filters?: DashboardStatsFilterDto,
  ): Promise<SingleResponse<any>> {
    return await this.statisticsService.getSmsReports(filters);
  }

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
