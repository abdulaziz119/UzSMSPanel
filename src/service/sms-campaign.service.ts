import {
  Inject,
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { SmsCampaignEntity } from '../entity/sms-campaign.entity';
import { SmsMessageEntity } from '../entity/sms-message.entity';
import { UserEntity } from '../entity/user.entity';
import { SmsGroupEntity } from '../entity/sms-group.entity';
import { ContactEntity } from '../entity/contact.entity';
import { SingleResponse, PaginationParams, ParamIdDto } from '../utils/dto/dto';
import { PaginationResponse } from '../utils/pagination.response';
import { getPaginationResponse } from '../utils/pagination.builder';
import {
  CampaignStatusEnum,
  CampaignTypeEnum,
} from '../utils/enum/sms-campaign.enum';
import {
  MessageStatusEnum,
  MessageDirectionEnum,
} from '../utils/enum/sms-message.enum';
import { MessageTypeEnum } from '../utils/enum/sms-price.enum';
import {
  CampaignFilterDto,
  CreateCampaignDto,
  UpdateCampaignDto,
} from '../utils/dto/sms-campaign.dto';

@Injectable()
export class SmsCampaignService {
  constructor(
    @Inject(MODELS.SMS_CAMPAIGN)
    private readonly campaignRepo: Repository<SmsCampaignEntity>,
    @Inject(MODELS.SMS_MESSAGE)
    private readonly messageRepo: Repository<SmsMessageEntity>,
    @Inject(MODELS.USER)
    private readonly userRepo: Repository<UserEntity>,
    @Inject(MODELS.SMS_GROUP)
    private readonly groupRepo: Repository<SmsGroupEntity>,
    @Inject(MODELS.CONTACT)
    private readonly contactRepo: Repository<ContactEntity>,
  ) {}

  async create(
    payload: CreateCampaignDto,
    user_id: number,
  ): Promise<SingleResponse<SmsCampaignEntity>> {
    try {
      // Foydalanuvchini tekshirish
      const user = await this.userRepo.findOne({ where: { id: user_id } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Guruhni tekshirish
      const group = await this.groupRepo.findOne({
        where: { id: payload.group_id, user_id },
      });
      if (!group) {
        throw new NotFoundException('SMS Group not found');
      }

      // Guruh kontaktlarini olish
      const contacts = await this.contactRepo.find({
        where: { user_id },
      });

      if (contacts.length === 0) {
        throw new BadRequestException('No contacts found in the group');
      }

      // Kampaniya yaratish
      const campaign = this.campaignRepo.create({
        user_id,
        name: payload.name,
        description: payload.description,
        group_id: payload.group_id,
        template_id: payload.template_id,
        message: payload.message,
        sender: payload.sender || 'UzSMS',
        message_type: payload.message_type || MessageTypeEnum.SMS,
        type: payload.type,
        scheduled_at: payload.scheduled_at,
        total_recipients: contacts.length,
        recipients: contacts.map((c) => ({
          id: c.id,
          phone: c.phone,
          name: c.name,
        })),
        settings: payload.settings,
        status: CampaignStatusEnum.DRAFT,
      });

      const savedCampaign = await this.campaignRepo.save(campaign);

      // Agar IMMEDIATE turi bo'lsa, darhol yuborish
      if (payload.type === CampaignTypeEnum.IMMEDIATE) {
        await this.startCampaign(savedCampaign.id, user_id);
      }

      return { result: savedCampaign };
    } catch (error) {
      throw new HttpException(
        { message: 'Error creating campaign', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(
    payload: PaginationParams,
    user_id: number,
  ): Promise<PaginationResponse<SmsCampaignEntity[]>> {
    const { page = 1, limit = 10 } = payload;
    const skip = (page - 1) * limit;

    try {
      const queryBuilder = this.campaignRepo
        .createQueryBuilder('campaign')
        .leftJoinAndSelect('campaign.group', 'group')
        .leftJoinAndSelect('campaign.template', 'template')
        .where('campaign.user_id = :user_id', { user_id })
        .orderBy('campaign.created_at', 'DESC');

      const [campaigns, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return getPaginationResponse<SmsCampaignEntity>(
        campaigns,
        page,
        limit,
        total,
      );
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching campaigns', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(
    payload: ParamIdDto,
    user_id: number,
  ): Promise<SingleResponse<SmsCampaignEntity>> {
    try {
      const campaign = await this.campaignRepo.findOne({
        where: { id: payload.id, user_id },
        relations: ['group', 'template'],
      });

      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }

      return { result: campaign };
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching campaign', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    updateData: UpdateCampaignDto,
    user_id: number,
  ): Promise<SingleResponse<SmsCampaignEntity>> {
    try {
      const campaign = await this.campaignRepo.findOne({
        where: { id: updateData.id, user_id },
      });

      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }

      // Faqat DRAFT statusdagi kampaniyalarni tahrirlash mumkin
      if (campaign.status !== CampaignStatusEnum.DRAFT) {
        throw new BadRequestException(
          'Cannot update active or completed campaign',
        );
      }

      await this.campaignRepo.update(updateData.id, updateData);

      const updatedCampaign = await this.campaignRepo.findOne({
        where: { id: updateData.id },
        relations: ['group', 'template'],
      });

      return { result: updatedCampaign };
    } catch (error) {
      throw new HttpException(
        { message: 'Error updating campaign', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async delete(
    payload: ParamIdDto,
    user_id: number,
  ): Promise<{ result: true }> {
    try {
      const campaign = await this.campaignRepo.findOne({
        where: { id: payload.id, user_id },
      });

      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }

      // Faqat DRAFT yoki FAILED statusdagi kampaniyalarni o'chirish mumkin
      if (campaign.status === CampaignStatusEnum.RUNNING) {
        throw new BadRequestException('Cannot delete active campaign');
      }

      await this.campaignRepo.softDelete(payload.id);
      return { result: true };
    } catch (error) {
      throw new HttpException(
        { message: 'Error deleting campaign', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async startCampaign(
    campaign_id: number,
    user_id: number,
  ): Promise<SingleResponse<{ message: string; campaign_id: number }>> {
    try {
      const campaign = await this.campaignRepo.findOne({
        where: { id: campaign_id, user_id },
        relations: ['group'],
      });

      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }

      if (campaign.status !== CampaignStatusEnum.DRAFT) {
        throw new BadRequestException('Campaign is not in draft status');
      }

      // Foydalanuvchi balansini tekshirish
      const user = await this.userRepo.findOne({ where: { id: user_id } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // SMS narxini hisoblash (soddalashtirilgan)
      const smsPrice = 100; // UZS
      const totalCost = campaign.total_recipients * smsPrice;

      if (user.balance < totalCost) {
        throw new BadRequestException('Insufficient balance');
      }

      // Kampaniya statusini yangilash
      await this.campaignRepo.update(campaign_id, {
        status: CampaignStatusEnum.RUNNING,
        started_at: new Date(),
        total_cost: totalCost,
      });

      // SMS xabarlarini yaratish
      await this.createSmsMessages(campaign, user_id);

      // Foydalanuvchi balansini yangilash
      await this.userRepo.update(user_id, {
        balance: user.balance - totalCost,
      });

      return {
        result: {
          message: 'Campaign started successfully',
          campaign_id,
        },
      };
    } catch (error) {
      throw new HttpException(
        { message: 'Error starting campaign', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async pauseCampaign(
    campaign_id: number,
    user_id: number,
  ): Promise<SingleResponse<{ message: string }>> {
    try {
      const campaign = await this.campaignRepo.findOne({
        where: { id: campaign_id, user_id },
      });

      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }

      if (campaign.status !== CampaignStatusEnum.RUNNING) {
        throw new BadRequestException('Campaign is not active');
      }

      await this.campaignRepo.update(campaign_id, {
        status: CampaignStatusEnum.PAUSED,
      });

      return { result: { message: 'Campaign paused successfully' } };
    } catch (error) {
      throw new HttpException(
        { message: 'Error pausing campaign', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCampaignStatistics(
    campaign_id: number,
    user_id?: number,
  ): Promise<SingleResponse<any>> {
    try {
      const whereCondition: any = { id: campaign_id };
      if (user_id) {
        whereCondition.user_id = user_id;
      }

      const campaign = await this.campaignRepo.findOne({
        where: whereCondition,
      });

      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }

      // SMS statistikalarini olish
      const sentCount = await this.messageRepo.count({
        where: { batch_id: campaign_id.toString() },
      });

      const deliveredCount = await this.messageRepo.count({
        where: {
          batch_id: campaign_id.toString(),
          status: MessageStatusEnum.DELIVERED,
        },
      });

      const failedCount = await this.messageRepo.count({
        where: {
          batch_id: campaign_id.toString(),
          status: MessageStatusEnum.FAILED,
        },
      });

      const pendingCount = await this.messageRepo.count({
        where: {
          batch_id: campaign_id.toString(),
          status: MessageStatusEnum.PENDING,
        },
      });

      // Kampaniya statistikalarini yangilash
      await this.campaignRepo.update(campaign_id, {
        sent_count: sentCount,
        delivered_count: deliveredCount,
        failed_count: failedCount,
      });

      const statistics = {
        campaign_id,
        campaign_name: campaign.name,
        status: campaign.status,
        total_recipients: campaign.total_recipients,
        sent_count: sentCount,
        delivered_count: deliveredCount,
        failed_count: failedCount,
        pending_count: pendingCount,
        total_cost: campaign.total_cost,
        started_at: campaign.started_at,
        completed_at: campaign.completed_at,
        delivery_rate: sentCount > 0 ? (deliveredCount / sentCount) * 100 : 0,
      };

      return { result: statistics };
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching campaign statistics', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Dashboard-specific methods
  async findAllCampaigns(
    filters: CampaignFilterDto,
  ): Promise<PaginationResponse<SmsCampaignEntity[]>> {
    try {
      const queryBuilder = this.campaignRepo
        .createQueryBuilder('campaign')
        .leftJoinAndSelect('campaign.group', 'group')
        .leftJoinAndSelect('campaign.user', 'user');

      // Apply filters
      if (filters.status) {
        queryBuilder.andWhere('campaign.status = :status', {
          status: filters.status,
        });
      }

      if (filters.type) {
        queryBuilder.andWhere('campaign.type = :type', { type: filters.type });
      }

      if (filters.user_id) {
        queryBuilder.andWhere('campaign.user_id = :user_id', {
          user_id: filters.user_id,
        });
      }

      if (filters.date_from) {
        queryBuilder.andWhere('campaign.created_at >= :date_from', {
          date_from: filters.date_from,
        });
      }

      if (filters.date_to) {
        queryBuilder.andWhere('campaign.created_at <= :date_to', {
          date_to: filters.date_to,
        });
      }

      if (filters.search) {
        queryBuilder.andWhere(
          '(campaign.name ILIKE :search OR campaign.description ILIKE :search)',
          { search: `%${filters.search}%` },
        );
      }

      queryBuilder.orderBy('campaign.created_at', 'DESC');

      const total = await queryBuilder.getCount();

      if (filters.page && filters.limit) {
        queryBuilder
          .skip((filters.page - 1) * filters.limit)
          .take(filters.limit);
      }

      const campaigns = await queryBuilder.getMany();

      return getPaginationResponse(
        campaigns,
        total,
        filters.page || 1,
        filters.limit || 10,
      );
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching campaigns', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCampaignDetails(
    id: number,
  ): Promise<SingleResponse<SmsCampaignEntity>> {
    try {
      const campaign = await this.campaignRepo.findOne({
        where: { id },
        relations: ['group', 'user', 'template'],
      });

      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }

      // Get campaign statistics
      const messageStats = await this.messageRepo
        .createQueryBuilder('message')
        .select([
          'COUNT(*) as total_messages',
          'SUM(CASE WHEN status = :delivered THEN 1 ELSE 0 END) as delivered_count',
          'SUM(CASE WHEN status = :failed THEN 1 ELSE 0 END) as failed_count',
          'SUM(CASE WHEN status = :pending THEN 1 ELSE 0 END) as pending_count',
          'SUM(cost) as total_cost',
        ])
        .where('batch_id = :batch_id', { batch_id: campaign.id.toString() })
        .setParameters({
          delivered: MessageStatusEnum.DELIVERED,
          failed: MessageStatusEnum.FAILED,
          pending: MessageStatusEnum.PENDING,
        })
        .getRawOne();

      const result = {
        ...campaign,
        statistics: messageStats,
      };

      return { result };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        { message: 'Error fetching campaign details', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async cancelCampaign(
    id: number,
  ): Promise<SingleResponse<{ message: string }>> {
    try {
      const campaign = await this.campaignRepo.findOne({ where: { id } });

      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }

      if (campaign.status === CampaignStatusEnum.COMPLETED) {
        throw new BadRequestException('Cannot cancel completed campaign');
      }

      // Update campaign status
      await this.campaignRepo.update(id, {
        status: CampaignStatusEnum.CANCELLED,
        updated_at: new Date(),
      });

      // Cancel pending messages
      await this.messageRepo.update(
        { batch_id: campaign.id.toString(), status: MessageStatusEnum.PENDING },
        { status: MessageStatusEnum.FAILED },
      );

      return { result: { message: 'Campaign cancelled successfully' } };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new HttpException(
        { message: 'Error cancelling campaign', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async bulkAction(
    campaign_ids: number[],
    action: 'start' | 'pause' | 'cancel',
  ): Promise<SingleResponse<{ message: string; affected_count: number }>> {
    try {
      let affected_count = 0;

      for (const id of campaign_ids) {
        try {
          switch (action) {
            case 'start':
              await this.startCampaign(id, 1); // Default user_id for admin actions
              affected_count++;
              break;
            case 'pause':
              await this.pauseCampaign(id, 1);
              affected_count++;
              break;
            case 'cancel':
              await this.cancelCampaign(id);
              affected_count++;
              break;
          }
        } catch (error) {
          // Continue with other campaigns if one fails
          console.error(`Failed to ${action} campaign ${id}:`, error.message);
        }
      }

      return {
        result: {
          message: `Bulk ${action} completed`,
          affected_count,
        },
      };
    } catch (error) {
      throw new HttpException(
        { message: `Error performing bulk ${action}`, error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async createSmsMessages(
    campaign: SmsCampaignEntity,
    user_id: number,
  ): Promise<void> {
    try {
      const contacts = campaign.recipients;
      const messages = [];

      for (const contact of contacts) {
        const messageId = `${campaign.id}_${contact.id}_${Date.now()}`;

        const smsMessage = this.messageRepo.create({
          user_id,
          message_id: messageId,
          batch_id: campaign.id.toString(),
          phone: contact.phone,
          message: campaign.message,
          sender: campaign.sender,
          status: MessageStatusEnum.PENDING,
          direction: MessageDirectionEnum.OUTBOUND,
          message_type: campaign.message_type,
          parts_count: Math.ceil(campaign.message.length / 160),
          cost: 100, // SMS narxi
        });

        messages.push(smsMessage);
      }

      await this.messageRepo.save(messages);
    } catch (error) {
      throw new HttpException(
        { message: 'Error creating SMS messages', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
