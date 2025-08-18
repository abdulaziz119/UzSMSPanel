import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SmsMessageEntity } from '../entity/sms-message.entity';
import {
  SendToContactDto,
  SendToGroupDto,
} from '../frontend/v1/modules/messages/dto/messages.dto';
import { ContactTypeEnum } from '../utils/enum/contact.enum';
import { SingleResponse } from '../utils/dto/dto';
import { Repository } from 'typeorm';
import { Inject } from '@nestjs/common';
import { MODELS } from '../constants/constants';
import { SmsTemplateEntity } from '../entity/sms-template.entity';
import { TemplateStatusEnum } from '../utils/enum/sms-template.enum';
import { SmsContactService } from './sms-contact.service';
import { SMSContactStatusEnum } from '../utils/enum/sms-contact.enum';
import { TariffEntity } from '../entity/tariffs.entity';
import { SmsMessageService } from './sms-message.service';
import { RedisCacheService } from './redis-cache.service';
import { BatchProcessor } from '../utils/batch-processor.util';
import { SmsContactEntity } from '../entity/sms-contact.entity';

@Injectable()
export class MessagesService {
  constructor(
    private readonly smsMessageService: SmsMessageService,
    private readonly smsContactService: SmsContactService,
    private readonly cache: RedisCacheService,
    @Inject(MODELS.SMS_TEMPLATE)
    private readonly smsTemplateRepo: Repository<SmsTemplateEntity>,
    @Inject(MODELS.SMS_CONTACT)
    private readonly smsContactRepo: Repository<SmsContactEntity>,
  ) {}

  async sendToContact(
    payload: SendToContactDto,
    user_id: number,
    balance?: ContactTypeEnum,
  ): Promise<SingleResponse<SmsMessageEntity>> {
    // 1) Template cache with longer TTL
    const templateCacheKey = `tpl:${Buffer.from(payload.message).toString('base64')}`;
    const getTemplate = await this.cache.getOrSet<SmsTemplateEntity | null>(
      templateCacheKey,
      async () =>
        this.smsTemplateRepo.findOne({
          where: {
            content: payload.message,
            status: TemplateStatusEnum.ACTIVE,
          },
        }),
      300, // Increased from 60 to 300 seconds
    );
    if (!getTemplate)
      throw new NotFoundException('Template not found or inactive');

    // 2) Optimized phone validation with cache
    const normalizedPhone: string = await this.smsContactService.normalizePhone(
      payload.phone,
    );
    
    // Cache phone validation results
    const phoneValidationKey = `phone_val:${normalizedPhone}`;
    const status: SMSContactStatusEnum = await this.cache.getOrSet<SMSContactStatusEnum>(
      phoneValidationKey,
      async () => this.smsContactService.validatePhoneNumber(normalizedPhone),
      1800, // 30 minutes cache for phone validation
    );
    
    if (status === SMSContactStatusEnum.INVALID_FORMAT)
      throw new BadRequestException('Invalid phone number format');
    if (status === SMSContactStatusEnum.BANNED_NUMBER)
      throw new BadRequestException('Banned phone number');

    // 3) Tariff cache with longer TTL
    const tariffCacheKey = `tariff:${normalizedPhone.substring(0, 5)}`;
    const tariff: TariffEntity | null =
      await this.cache.getOrSet<TariffEntity | null>(
        tariffCacheKey,
        async () =>
          this.smsContactService.resolveTariffForPhone(normalizedPhone),
        600, // Increased from 300 to 600 seconds
      );
    if (!tariff)
      throw new NotFoundException('Tariff not found for this phone number');

    // 4) Pricing calculation (unchanged)
    const partsCount: number = Math.max(
      1,
      Number(getTemplate.parts_count || 1),
    );
    const unitPrice: number = Number(tariff.price || 0);
    const totalCost: number = unitPrice * partsCount;

    // 5) Create with billing
    const savedSmsMessage =
      await this.smsMessageService.createSmsMessageWithBilling(
        {
          user_id,
          phone: payload.phone,
          message: payload.message,
          operator: tariff.operator,
          sms_template_id: getTemplate.id,
          cost: totalCost,
          price_provider_sms: tariff.price_provider_sms,
        },
        getTemplate,
        balance,
        totalCost,
      );

    return { result: savedSmsMessage };
  }

  async sendToGroup(
    payload: SendToGroupDto,
    user_id: number,
    balance?: ContactTypeEnum,
  ): Promise<SingleResponse<SmsMessageEntity[]>> {
    // 1) Template cache with longer TTL
    const templateCacheKey = `tpl:${Buffer.from(payload.message).toString('base64')}`;
    const getTemplate = await this.cache.getOrSet<SmsTemplateEntity | null>(
      templateCacheKey,
      async () =>
        this.smsTemplateRepo.findOne({ where: { content: payload.message } }),
      300, // Increased from 60 to 300 seconds
    );
    if (!getTemplate) throw new NotFoundException('Template not found');

    // 2) Group existence check with cache
    const groupCacheKey = `group_exists:${payload.group_id}`;
    const hasAny = await this.cache.getOrSet<boolean>(
      groupCacheKey,
      async () => {
        const contact = await this.smsContactRepo.findOne({
          where: { group_id: payload.group_id },
        });
        return !!contact;
      },
      600, // 10 minutes cache
    );
    if (!hasAny) throw new NotFoundException('No contacts found for group');

    // 3) Valid contacts with tariffs (with cache)
    const contactsCacheKey = `group_contacts:${payload.group_id}`;
    const data = await this.cache.getOrSet(
      contactsCacheKey,
      async () => this.smsContactService.getValidContactsWithTariffs(payload.group_id),
      300, // 5 minutes cache for contacts
    );
    
    const items = data.map((d) => ({
      phone: d.contact.phone,
      tariff: d.tariff,
      unitPrice: Number(d.tariff.price || 0),
    }));
    if (items.length === 0)
      throw new NotFoundException(
        'No valid contacts with tariffs in the group',
      );

    // 4) Pricing total
    const partsCount: number = Math.max(
      1,
      Number(getTemplate.parts_count || 1),
    );
    const totalCost = items.reduce(
      (sum, it) => sum + it.unitPrice * partsCount,
      0,
    );

    // 5) Optimized batch processing for very large groups
    const BATCH_SIZE = 500; // Increased from 100 to 500
    if (items.length > BATCH_SIZE) {
      const messages = await BatchProcessor.processParallelBatches(
        items,
        BATCH_SIZE,
        5, // 5 parallel batches instead of sequential
        async (batch) => {
          const batchSmsData = batch.map((it) => ({
            user_id,
            phone: it.phone,
            message: payload.message,
            operator: it.tariff.operator,
            sms_template_id: getTemplate.id,
            cost: it.unitPrice * partsCount,
            price_provider_sms: it.tariff.price_provider_sms,
            group_id: payload.group_id,
          }));

          return await this.smsMessageService.createBulkSmsMessagesWithBilling(
            batchSmsData,
            getTemplate,
            balance,
            batch.reduce((sum, it) => sum + it.unitPrice * partsCount, 0),
          );
        },
      );

      return { result: messages.flat() };
    }

    // 6) Regular bulk processing
    const smsDataArray = items.map((it) => ({
      user_id,
      phone: it.phone,
      message: payload.message,
      operator: it.tariff.operator,
      sms_template_id: getTemplate.id,
      cost: it.unitPrice * partsCount,
      price_provider_sms: it.tariff.price_provider_sms,
      group_id: payload.group_id,
    }));

    const messages =
      await this.smsMessageService.createBulkSmsMessagesWithBilling(
        smsDataArray,
        getTemplate,
        balance,
        totalCost,
      );

    return { result: messages };
  }
}
