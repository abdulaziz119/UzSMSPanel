import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { SmsContactEntity } from '../entity/sms-contact.entity';
import { ContactEntity } from '../entity/contact.entity';
import { SmsTemplateEntity } from '../entity/sms-template.entity';
import { SMSContactStatusEnum } from '../utils/enum/sms-contact.enum';
import { ContactStatusEnum, ContactTypeEnum } from '../utils/enum/contact.enum';
import { SmsContactService } from './sms-contact.service';
import { analyzeSmsContent } from '../utils/sms-counter.util';
import {
  CanSendContactDto,
  CanSendGroupDto,
} from '../frontend/v1/modules/sms-sending/dto/sms-sending.dto';
import { TariffEntity } from '../entity/tariffs.entity';

@Injectable()
export class SmsSendingService {
  constructor(
    @Inject(MODELS.SMS_CONTACT)
    private readonly smsContactRepo: Repository<SmsContactEntity>,
    @Inject(MODELS.CONTACT)
    private readonly contactRepo: Repository<ContactEntity>,
    @Inject(MODELS.SMS_TEMPLATE)
    private readonly smsTemplateRepo: Repository<SmsTemplateEntity>,
    private readonly smsContactService: SmsContactService,
  ) {}

  private async getBalanceByType(
    user_id: number,
    balanceType?: ContactTypeEnum | string,
  ): Promise<number> {
    const type: ContactTypeEnum =
      (balanceType as ContactTypeEnum) || ContactTypeEnum.INDIVIDUAL;

    const raw = await this.contactRepo
      .createQueryBuilder('c')
      .select('COALESCE(MAX(c.balance), 0)', 'max')
      .where('c.user_id = :user_id', { user_id })
      .andWhere('c.type = :type', { type })
      .andWhere('c.status = :status', { status: ContactStatusEnum.ACTIVE })
      .getRawOne<{ max: string }>();

    return Number(raw?.max || 0);
  }

  private async resolvePartsCount(
    message?: string,
    sms_template_id?: number,
  ): Promise<number> {
    if (message && message.length > 0) {
      return analyzeSmsContent(message).parts;
    }
    if (sms_template_id) {
      const tpl: SmsTemplateEntity = await this.smsTemplateRepo.findOne({
        where: { id: sms_template_id },
      });
      if (!tpl) throw new BadRequestException('Shablon topilmadi');
      if (tpl.content && tpl.content.length > 0) {
        return analyzeSmsContent(tpl.content).parts;
      }
    }
    return 1;
  }

  async estimateCanSendContact(
    user_id: number,
    body: CanSendContactDto,
    balanceType?: ContactTypeEnum,
  ): Promise<{
    can_send: boolean;
    current_balance: number;
    required_cost: number;
    deficit: number;
    breakdown_by_operator: Array<{
      operator: string;
      unit_price: number;
      parts_count: number;
      count: number;
      subtotal: number;
    }>;
  }> {
    if (!body.phone && !body.contact_id)
      throw new BadRequestException('phone yoki contact_id talab qilinadi');
    if (!body.message && !body.sms_template_id)
      throw new BadRequestException(
        'message yoki sms_template_id talab qilinadi',
      );

    const current_balance: number = await this.getBalanceByType(
      user_id,
      balanceType,
    );

    // Resolve phone
    let phone: string = body.phone || '';
    if (!phone && body.contact_id) {
      const contact: SmsContactEntity = await this.smsContactRepo.findOne({
        where: { id: body.contact_id },
      });
      if (!contact) throw new BadRequestException('Kontakt topilmadi');
      phone = contact.phone;
    }

    const normalized: string =
      await this.smsContactService.normalizePhone(phone);
    const status = await this.smsContactService.validatePhoneNumber(normalized);
    if (status !== SMSContactStatusEnum.ACTIVE)
      throw new BadRequestException('Telefon raqami yaroqsiz yoki taqiqlangan');

    // Tariff and unit price
    const tariff: TariffEntity =
      await this.smsContactService.resolveTariffForPhone(normalized);
    if (!tariff) throw new BadRequestException('Tarif topilmadi');
    const unit_price: number = Number(tariff.price || 0);

    // Parts count
    const parts_count: number = await this.resolvePartsCount(
      body.message,
      body.sms_template_id,
    );

    const required_cost: number = unit_price * parts_count;
    const can_send: boolean = current_balance >= required_cost;
    const deficit: number = can_send
      ? 0
      : Math.max(0, required_cost - current_balance);

    return {
      can_send,
      current_balance,
      required_cost,
      deficit,
      breakdown_by_operator: [
        {
          operator: tariff.operator,
          unit_price,
          parts_count,
          count: 1,
          subtotal: required_cost,
        },
      ],
    };
  }

  async estimateCanSendGroup(
    user_id: number,
    body: CanSendGroupDto,
    balanceType?: ContactTypeEnum,
  ): Promise<{
    can_send: boolean;
    current_balance: number;
    required_cost: number;
    deficit: number;
    total_contacts: number;
    valid_contacts: number;
    invalid_contacts: number;
    parts_count: number;
    breakdown_by_operator: Array<{
      operator: string;
      unit_price: number;
      count: number;
      subtotal: number;
    }>;
  }> {
    if (!body?.group_id)
      throw new BadRequestException('group_id talab qilinadi');
    if (!body.message && !body.sms_template_id)
      throw new BadRequestException(
        'message yoki sms_template_id talab qilinadi',
      );

    const current_balance: number = await this.getBalanceByType(
      user_id,
      balanceType,
    );

    // parts count
    const parts_count: number = await this.resolvePartsCount(
      body.message,
      body.sms_template_id,
    );

    // Get valid contacts with tariffs
    // Use optimized bulk tariff resolver to minimize DB roundtrips
    const items =
      await this.smsContactService.getValidContactsWithTariffsOptimized(
        body.group_id,
      );

    const total_contacts: number = await this.smsContactRepo.count({
      where: { group_id: body.group_id },
    });
    const valid_contacts: number = items.length;
    const invalid_contacts: number = Math.max(
      0,
      total_contacts - valid_contacts,
    );

    // Aggregate by operator
    type Row = {
      operator: string;
      unit_price: number;
      count: number;
      subtotal: number;
    };
    const map = new Map<string, Row>();
    let required_cost: number = 0;
    for (const it of items) {
      const op: string = it.tariff.operator;
      const unit_price: number = Number(it.tariff.price || 0);
      const subtotal: number = unit_price * parts_count;
      required_cost += subtotal;
      const row = map.get(op) || {
        operator: op,
        unit_price,
        count: 0,
        subtotal: 0,
      };
      row.count += 1;
      row.subtotal += subtotal;
      map.set(op, row);
    }

    const can_send: boolean = current_balance >= required_cost;
    const deficit: number = can_send
      ? 0
      : Math.max(0, required_cost - current_balance);

    return {
      can_send,
      current_balance,
      required_cost,
      deficit,
      total_contacts,
      valid_contacts,
      invalid_contacts,
      parts_count,
      breakdown_by_operator: Array.from(map.values()),
    };
  }
}
