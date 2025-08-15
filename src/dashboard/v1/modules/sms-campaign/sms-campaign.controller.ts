import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SingleResponse, ParamIdDto } from '../../../../utils/dto/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { SmsCampaignService } from '../../../../service/sms-campaign.service';
import { SmsCampaignEntity } from '../../../../entity/sms-campaign.entity';
import { PaginationResponse } from '../../../../utils/pagination.response';
import {
  CampaignFilterDto,
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignStatsDto,
} from '../../../../utils/dto/sms-campaign.dto';

@ApiBearerAuth()
@ApiTags('sms-campaign')
@Controller({ path: '/dashboard/sms-campaign', version: '1' })
export class SmsCampaignController {
  constructor(private readonly smsCampaignService: SmsCampaignService) {}

  /**
   * SMS kampaniyalar ro'yxati (admin) — filter + pagination
   */
  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async findAllCampaigns(
    @Body() filters: CampaignFilterDto,
  ): Promise<PaginationResponse<SmsCampaignEntity[]>> {
    return await this.smsCampaignService.findAllCampaigns(filters);
  }

  /**
   * Kampaniya tafsilotlari (ID bo'yicha)
   */
  @Post('/details')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getCampaignDetails(
    @Body() param: ParamIdDto,
  ): Promise<SingleResponse<SmsCampaignEntity>> {
    return await this.smsCampaignService.getCampaignDetails(param.id);
  }

  /**
   * Kampaniyani boshlash (admin)
   */
  @Post('/start')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async startCampaign(
    @Body() param: ParamIdDto,
  ): Promise<SingleResponse<{ message: string }>> {
    // For admin actions, use admin user_id (can be extracted from JWT)
    return await this.smsCampaignService.startCampaign(param.id, 1);
  }

  /**
   * Kampaniyani pauza qilish (admin)
   */
  @Post('/pause')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async pauseCampaign(
    @Body() param: ParamIdDto,
  ): Promise<SingleResponse<{ message: string }>> {
    // For admin actions, use admin user_id (can be extracted from JWT)
    return await this.smsCampaignService.pauseCampaign(param.id, 1);
  }

  /**
   * Kampaniyani bekor qilish (admin)
   */
  @Post('/cancel')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async cancelCampaign(
    @Body() param: ParamIdDto,
  ): Promise<SingleResponse<{ message: string }>> {
    return await this.smsCampaignService.cancelCampaign(param.id);
  }

  /**
   * Kampaniya statistikasi (admin)
   */
  @Post('/statistics')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async getCampaignStatistics(
    @Body() body: { campaign_id: number },
  ): Promise<SingleResponse<any>> {
    // For admin statistics, don't filter by user_id
    return await this.smsCampaignService.getCampaignStatistics(
      body.campaign_id,
    );
  }

  /**
   * Bir nechta kampaniyaga ommaviy amal bajarish
   */
  @Post('/bulk-action')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async bulkAction(
    @Body()
    body: {
      campaign_ids: number[];
      action: 'start' | 'pause' | 'cancel';
    },
  ): Promise<SingleResponse<{ message: string; affected_count: number }>> {
    return await this.smsCampaignService.bulkAction(
      body.campaign_ids,
      body.action,
    );
  }
}
