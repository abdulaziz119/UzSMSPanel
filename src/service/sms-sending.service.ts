import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { SmsContactEntity } from '../entity/sms-contact.entity';
import { ContactEntity } from '../entity/contact.entity';
import { SmsTemplateEntity } from '../entity/sms-template.entity';
import { SMSContactStatusEnum } from '../utils/enum/sms-contact.enum';
import { ContactStatusEnum, ContactTypeEnum } from '../utils/enum/contact.enum';
import { TemplateStatusEnum } from '../utils/enum/sms-template.enum';
import { SmsContactService } from './sms-contact.service';
import { analyzeSmsContent } from '../utils/sms-counter.util';
import {
  SendToContactDto,
  SendToGroupDto,
} from '../frontend/v1/modules/sms-sending/dto/sms-sending.dto';
import { TariffEntity } from '../entity/tariffs.entity';
import { ValidateBeforeQueueGroupResponse } from '../utils/interfaces/request/sms-sending.request.interfaces';
import { MobiUzSmppService } from './mobi-uz.smpp.service';

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
    private readonly smppService: MobiUzSmppService,
  ) {}

  private async getBalanceByType(
    user_id: number,
    balanceType?: ContactTypeEnum | string,
  ): Promise<number> {
    const type: ContactTypeEnum =
      (balanceType as ContactTypeEnum) || ContactTypeEnum.INDIVIDUAL;

    const balanceField =
      type === ContactTypeEnum.INDIVIDUAL
        ? 'c.individual_balance'
        : 'c.company_balance';

    const raw = await this.contactRepo
      .createQueryBuilder('c')
      .select(`COALESCE(MAX(${balanceField}), 0)`, 'max')
      .where('c.user_id = :user_id', { user_id })
      .andWhere('c.type = :type', { type })
      .andWhere('c.status = :status', { status: ContactStatusEnum.ACTIVE })
      .getRawOne<{ max: string }>();

    return Number(raw?.max || 0);
  }

  async validateBeforeQueueContact(
    user_id: number,
    body: SendToContactDto,
    balanceType?: ContactTypeEnum,
  ): Promise<void> {
    await this.smppService.ensureConnection();

    await this.validateSmsTemplate(user_id, body.message);

    const current_balance: number = await this.getBalanceByType(
      user_id,
      balanceType,
    );

    const normalized: string = await this.smsContactService.normalizePhone(
      body.phone,
    );
    const status: SMSContactStatusEnum =
      await this.smsContactService.validatePhoneNumber(normalized);
    if (status !== SMSContactStatusEnum.ACTIVE) {
      throw new HttpException(
        'Phone number is invalid or banned.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const tariff: TariffEntity =
      await this.smsContactService.resolveTariffForPhone(normalized);
    if (!tariff) {
      throw new HttpException('Tariff not found', HttpStatus.NOT_FOUND);
    }

    const parts_count: number = analyzeSmsContent(body.message).parts;
    const required_cost: number = Number(tariff.price || 0) * parts_count;

    if (current_balance < required_cost) {
      throw new HttpException(
        `The balance is not enough. It is necessary: ${required_cost}, There is: ${current_balance}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async validateBeforeQueueGroup(
    user_id: number,
    body: SendToGroupDto,
    balanceType?: ContactTypeEnum,
  ): Promise<ValidateBeforeQueueGroupResponse> {
    await this.smppService.ensureConnection();

    await this.validateSmsTemplate(user_id, body.message);

    const current_balance: number = await this.getBalanceByType(
      user_id,
      balanceType,
    );

    const items =
      await this.smsContactService.getValidContactsWithTariffsOptimized(
        body.group_id,
      );

    const total_contacts: number = await this.smsContactRepo.count({
      where: { group_id: body.group_id },
    });

    const valid_contact_count: number = items.length;
    const invalid_contact_count: number = Math.max(
      0,
      total_contacts - valid_contact_count,
    );

    if (items.length === 0) {
      throw new HttpException(
        'No valid contacts found in the group.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const parts_count: number = analyzeSmsContent(body.message).parts;
    let required_cost: number = 0;

    for (const item of items) {
      const unit_price: number = Number(item.tariff.price || 0);
      required_cost += unit_price * parts_count;
    }

    if (current_balance < required_cost) {
      throw new HttpException(
        `The balance is not enough. It is necessary: ${required_cost}, There is: ${current_balance}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      contact_count: total_contacts,
      valid_contact_count,
      invalid_contact_count,
    };
  }

  private async validateSmsTemplate(
    user_id: number,
    message: string,
  ): Promise<void> {
    const template: SmsTemplateEntity = await this.smsTemplateRepo.findOne({
      where: {
        content: message,
        user_id: user_id,
        status: TemplateStatusEnum.ACTIVE,
      },
    });

    if (!template) {
      throw new HttpException(
        'SMS template not found or inactive',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
