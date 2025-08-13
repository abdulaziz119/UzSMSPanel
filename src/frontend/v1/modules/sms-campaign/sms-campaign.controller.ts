import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SingleResponse, ParamIdDto } from '../../../../utils/dto/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { User } from '../auth/decorators/user.decorator';
import { SmsCampaignService } from '../../../../service/sms-campaign.service';
import { SmsCampaignEntity } from '../../../../entity/sms-campaign.entity';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { 
  CampaignFilterDto,
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignStatsDto 
} from '../../../../utils/dto/sms-campaign.dto';

@ApiBearerAuth()
@ApiTags('SMS Campaign')
@Controller({ path: '/frontend/sms-campaign', version: '1' })
export class SmsCampaignController {
  constructor(private readonly smsCampaignService: SmsCampaignService) {}

  @Post('/create')
  @HttpCode(201)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async createCampaign(
    @Body() body: CreateCampaignDto,
    @User('id') user_id: number,
  ): Promise<SingleResponse<SmsCampaignEntity>> {
    // Convert string date to Date object for service
    const convertedBody = {
      ...body,
      scheduled_at: body.scheduled_at ? new Date(body.scheduled_at) : undefined,
    };
    return await this.smsCampaignService.create(convertedBody, user_id);
  }

  @Post('/update')
  @HttpCode(200)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async updateCampaign(
    @Body() body: UpdateCampaignDto,
    @User('id') user_id: number,
  ): Promise<SingleResponse<SmsCampaignEntity>> {
    // Convert string date to Date object for service
    const convertedBody = {
      ...body,
      scheduled_at: body.scheduled_at ? new Date(body.scheduled_at) : undefined,
    };
    return await this.smsCampaignService.update(convertedBody, user_id);
  }

  @Post('/findAll')
  @HttpCode(200)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async findAllCampaigns(
    @Body() filters: CampaignFilterDto,
    @User('id') user_id: number,
  ): Promise<PaginationResponse<SmsCampaignEntity[]>> {
    return await this.smsCampaignService.findAll(filters, user_id);
  }

  @Post('/details')
  @HttpCode(200)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async getCampaignDetails(
    @Body() param: ParamIdDto,
    @User('id') user_id: number,
  ): Promise<SingleResponse<SmsCampaignEntity>> {
    return await this.smsCampaignService.findOne(param, user_id);
  }

  @Post('/delete')
  @HttpCode(200)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async deleteCampaign(
    @Body() param: ParamIdDto,
    @User('id') user_id: number,
  ) {
    return await this.smsCampaignService.delete(param, user_id);
  }

  @Post('/start')
  @HttpCode(200)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async startCampaign(
    @Body() param: ParamIdDto,
    @User('id') user_id: number,
  ) {
    return await this.smsCampaignService.startCampaign(param.id, user_id);
  }

  @Post('/pause')
  @HttpCode(200)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async pauseCampaign(
    @Body() param: ParamIdDto,
    @User('id') user_id: number,
  ) {
    return await this.smsCampaignService.pauseCampaign(param.id, user_id);
  }

  @Post('/statistics')
  @HttpCode(200)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async getCampaignStatistics(
    @Body() param: ParamIdDto,
    @User('id') user_id: number,
  ): Promise<SingleResponse<any>> {
    return await this.smsCampaignService.getCampaignStatistics(param.id, user_id);
  }
}
