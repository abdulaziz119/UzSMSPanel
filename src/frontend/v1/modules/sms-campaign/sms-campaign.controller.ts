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
  CampaignStatsDto,
} from '../../../../utils/dto/sms-campaign.dto';

@ApiBearerAuth()
@ApiTags('SMS Campaign')
@Controller({ path: '/frontend/sms-campaign', version: '1' })
export class SmsCampaignController {
  constructor(private readonly smsCampaignService: SmsCampaignService) {}

  /**
   * Yangi SMS kampaniya yaratish API
   * Foydalanuvchi yangi SMS yuborish kampaniyasini yaratadi
   * Scheduled vaqtni ham belgilash mumkin (keyinchalik yuborish uchun)
   */
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

  /**
   * Mavjud SMS kampaniyasini yangilash API
   * Kampaniya ma'lumotlarini o'zgartirish (nom, matn, vaqt va h.k.)
   * Faqat hali boshlanmagan kampaniyalarni yangilash mumkin
   */
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

  /**
   * Foydalanuvchining barcha SMS kampaniyalarini ko'rish API
   * Filter va pagination bilan ro'yxatni cheklash mumkin
   * Status, sana va boshqa parametrlar bo'yicha filter qilish
   */
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

  /**
   * Muayyan SMS kampaniyasining batafsil ma'lumotlarini olish API
   * Kampaniya ID orqali to'liq ma'lumotlarni ko'rish
   * Yuborilgan SMS lar soni, status va boshqa tafsilotlar
   */
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

  /**
   * SMS kampaniyasini o'chirish API
   * Faqat hali boshlanmagan yoki to'xtatilgan kampaniyalarni o'chirish mumkin
   * O'chirilgandan keyin qayta tiklash mumkin emas
   */
  @Post('/delete')
  @HttpCode(200)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async deleteCampaign(@Body() param: ParamIdDto, @User('id') user_id: number) {
    return await this.smsCampaignService.delete(param, user_id);
  }

  /**
   * SMS kampaniyasini boshlash API
   * Tayyorlangan kampaniyani faollashtirish va SMS yuborishni boshlash
   * Balans yetarli bo'lishi va barcha ma'lumotlar to'g'ri bo'lishi kerak
   */
  @Post('/start')
  @HttpCode(200)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async startCampaign(@Body() param: ParamIdDto, @User('id') user_id: number) {
    return await this.smsCampaignService.startCampaign(param.id, user_id);
  }

  /**
   * SMS kampaniyasini to'xtatish API
   * Faol kampaniyani vaqtincha to'xtatish
   * Keyinchalik qayta boshlash mumkin
   */
  @Post('/pause')
  @HttpCode(200)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async pauseCampaign(@Body() param: ParamIdDto, @User('id') user_id: number) {
    return await this.smsCampaignService.pauseCampaign(param.id, user_id);
  }

  /**
   * SMS kampaniyasi statistikalarini olish API
   * Yuborilgan, yetkazilgan, muvaffaqiyatsiz SMS lar soni
   * Umumiy xarajat va boshqa analitik ma'lumotlar
   */
  @Post('/statistics')
  @HttpCode(200)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async getCampaignStatistics(
    @Body() param: ParamIdDto,
    @User('id') user_id: number,
  ): Promise<SingleResponse<any>> {
    return await this.smsCampaignService.getCampaignStatistics(
      param.id,
      user_id,
    );
  }
}
