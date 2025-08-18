import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SmsMessageService } from './sms-message.service';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { SmsContactEntity } from '../entity/sms-contact.entity';
import { SmsTemplateEntity } from '../entity/sms-template.entity';
import { TariffEntity } from '../entity/tariffs.entity';
import { SmsMessageEntity } from '../entity/sms-message.entity';
import {
  SendToContactDto,
  SendToGroupDto,
} from '../frontend/v1/modules/messages/dto/messages.dto';
import { ContactTypeEnum } from '../utils/enum/contact.enum';
import { TemplateStatusEnum } from '../utils/enum/sms-template.enum';
import { SMSContactStatusEnum } from '../utils/enum/sms-contact.enum';
import { SingleResponse } from '../utils/dto/dto';
import { SmsContactService } from './sms-contact.service';

@Injectable()
export class MessagesService {
  constructor(
    private readonly smsMessageService: SmsMessageService,
    private readonly smsContactService: SmsContactService,
    @Inject(MODELS.SMS_CONTACT)
    private readonly smsContactRepo: Repository<SmsContactEntity>,
    @Inject(MODELS.SMS_TEMPLATE)
    private readonly smsTemplateRepo: Repository<SmsTemplateEntity>,
  ) {}

  async sendToContact(
    payload: SendToContactDto,
    user_id: number,
    balance?: ContactTypeEnum,
  ): Promise<SingleResponse<SmsMessageEntity>> {
    try {
      // Validate template
      const getTemplate: SmsTemplateEntity = await this.smsTemplateRepo.findOne(
        {
          where: {
            content: payload.message,
            status: TemplateStatusEnum.ACTIVE,
          },
        },
      );
      if (!getTemplate) {
        throw new NotFoundException('Template not found or inactive');
      }

      // Validate phone number
      const normalizedPhone: string =
        await this.smsContactService.normalizePhone(payload.phone);
      const status: SMSContactStatusEnum =
        await this.smsContactService.validatePhoneNumber(normalizedPhone);
      if (status === SMSContactStatusEnum.INVALID_FORMAT) {
        throw new BadRequestException('Invalid phone number format');
      }
      if (status === SMSContactStatusEnum.BANNED_NUMBER) {
        throw new BadRequestException('Banned phone number');
      }

      // Get tariff for the phone number
      const tariff: TariffEntity | null =
        await this.smsContactService.resolveTariffForPhone(normalizedPhone);

      if (!tariff) {
        throw new NotFoundException('Tariff not found for this phone number');
      }

      // Calculate cost - parts_count qanchalik bo'lsa, shunchalik kontaktlar uchun narx hisoblanadi
      const partsCount: number = Math.max(
        1,
        Number(getTemplate.parts_count || 1),
      );
      const unitPrice: number = Number(tariff.price || 0);
      const totalCost: number = unitPrice * partsCount;

      // Create SMS message with transaction (includes billing and message creation)
      const savedSmsMessage =
        await this.smsMessageService.createSmsMessageWithBilling(
          {
            user_id: user_id,
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
    } catch (error) {
      throw error;
    }
  }

  async sendToGroup(
    payload: SendToGroupDto,
    user_id: number,
    balance?: ContactTypeEnum,
  ): Promise<SingleResponse<SmsMessageEntity[]>> {
    try {
      // Validate template
      const getTemplate: SmsTemplateEntity = await this.smsTemplateRepo.findOne(
        { where: { content: payload.message } },
      );
      if (!getTemplate) {
        throw new NotFoundException('Template not found');
      }

      // Fetch contacts of the group
      const contacts: SmsContactEntity = await this.smsContactRepo.findOne({
        where: { group_id: payload.group_id },
      });
      if (!contacts) {
        throw new NotFoundException('No contacts found for group');
      }

      // Get valid contacts with tariffs
      const data = await this.smsContactService.getValidContactsWithTariffs(
        payload.group_id,
      );
      const items = data.map((d) => ({
        phone: d.contact.phone,
        tariff: d.tariff,
        unitPrice: Number(d.tariff.price || 0),
      }));

      if (items.length === 0) {
        throw new NotFoundException(
          'No valid contacts with tariffs in the group',
        );
      }

      // Calculate total cost - parts_count qanchalik bo'lsa, har bir kontakt uchun shunchalik marta narx hisoblanadi
      const partsCount: number = Math.max(
        1,
        Number(getTemplate.parts_count || 1),
      );
      const totalCost = items.reduce(
        (sum, it) => sum + it.unitPrice * partsCount,
        0,
      );

      // Create SMS messages in bulk with transaction (includes billing and message creation)
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
    } catch (error) {
      throw error;
    }
  }
}
