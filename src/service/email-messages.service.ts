import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MODELS } from '../constants/constants';
import { EmailContactEntity } from '../entity/email-contact.entity';
import { ContactEntity } from '../entity/contact.entity';
import { EmailTemplateEntity } from '../entity/email-template.entity';
import { EmailContactStatusEnum } from '../utils/enum/email-contact.enum';
import { ContactStatusEnum, ContactTypeEnum } from '../utils/enum/contact.enum';
import { EmailContactService } from './email-contact.service';
import {
  CanSendEmailToContactDto,
  CanSendEmailToGroupDto,
} from '../frontend/v1/modules/email-messages/dto/email-messages.dto';

@Injectable()
export class EmailMessagesService {
  constructor(
    @Inject(MODELS.EMAIL_CONTACT)
    private readonly emailContactRepo: Repository<EmailContactEntity>,
    @Inject(MODELS.CONTACT)
    private readonly contactRepo: Repository<ContactEntity>,
    @Inject(MODELS.EMAIL_TEMPLATE)
    private readonly emailTemplateRepo: Repository<EmailTemplateEntity>,
    private readonly emailContactService: EmailContactService,
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

  private async resolveEmailContent(
    subject?: string,
    html_content?: string,
    email_template_id?: number,
  ): Promise<{ subject: string; html_content: string; valid: boolean }> {
    if (subject && html_content) {
      return { subject, html_content, valid: true };
    }
    if (email_template_id) {
      const template: EmailTemplateEntity = await this.emailTemplateRepo.findOne({
        where: { id: email_template_id },
      });
      if (!template) throw new BadRequestException('Email shablon topilmadi');
      if (template.subject && template.html_content) {
        return { 
          subject: template.subject, 
          html_content: template.html_content, 
          valid: true 
        };
      }
    }
    return { subject: '', html_content: '', valid: false };
  }

  async estimateCanSendEmailToContact(
    user_id: number,
    body: CanSendEmailToContactDto,
    balanceType?: ContactTypeEnum,
  ): Promise<{
    can_send: boolean;
    current_balance: number;
    required_cost: number;
    deficit: number;
    breakdown: {
      email_cost: number;
      count: number;
      subtotal: number;
    };
  }> {
    if (!body.email && !body.contact_id)
      throw new BadRequestException('email yoki contact_id talab qilinadi');
    if (!body.email_template_id)
      throw new BadRequestException('email_template_id talab qilinadi');

    const current_balance: number = await this.getBalanceByType(
      user_id,
      balanceType,
    );

    // Resolve email
    let email: string = body.email || '';
    if (!email && body.contact_id) {
      const contact: EmailContactEntity = await this.emailContactRepo.findOne({
        where: { id: body.contact_id },
      });
      if (!contact) throw new BadRequestException('Email kontakt topilmadi');
      email = contact.email;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Email manzil yaroqsiz');
    }

    // Validate template exists
    const template: EmailTemplateEntity = await this.emailTemplateRepo.findOne({
      where: { id: body.email_template_id },
    });
    if (!template) throw new BadRequestException('Email shablon topilmadi');

    // Email cost (fixed cost per email - you can adjust this)
    const email_cost: number = 10; // 10 units per email
    const required_cost: number = email_cost;
    const can_send: boolean = current_balance >= required_cost;
    const deficit: number = can_send
      ? 0
      : Math.max(0, required_cost - current_balance);

    return {
      can_send,
      current_balance,
      required_cost,
      deficit,
      breakdown: {
        email_cost,
        count: 1,
        subtotal: required_cost,
      },
    };
  }

  async estimateCanSendEmailToGroup(
    user_id: number,
    body: CanSendEmailToGroupDto,
    balanceType?: ContactTypeEnum,
  ): Promise<{
    can_send: boolean;
    current_balance: number;
    required_cost: number;
    deficit: number;
    total_contacts: number;
    valid_contacts: number;
    invalid_contacts: number;
    breakdown: {
      email_cost: number;
      count: number;
      subtotal: number;
    };
  }> {
    if (!body?.group_id)
      throw new BadRequestException('group_id talab qilinadi');
    if (!body.email_template_id)
      throw new BadRequestException('email_template_id talab qilinadi');

    const current_balance: number = await this.getBalanceByType(
      user_id,
      balanceType,
    );

    // Validate template exists
    const template: EmailTemplateEntity = await this.emailTemplateRepo.findOne({
      where: { id: body.email_template_id },
    });
    if (!template) throw new BadRequestException('Email shablon topilmadi');

    // Get valid contacts from group
    const contacts = await this.emailContactRepo.find({
      where: { 
        group_id: body.group_id,
        is_active: true 
      },
    });

    const total_contacts: number = await this.emailContactRepo.count({
      where: { group_id: body.group_id },
    });

    // Filter valid emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valid_contacts_list = contacts.filter(contact => 
      emailRegex.test(contact.email)
    );
    
    const valid_contacts: number = valid_contacts_list.length;
    const invalid_contacts: number = Math.max(
      0,
      total_contacts - valid_contacts,
    );

    // Email cost calculation
    const email_cost: number = 10; // 10 units per email
    const required_cost: number = email_cost * valid_contacts;
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
      breakdown: {
        email_cost,
        count: valid_contacts,
        subtotal: required_cost,
      },
    };
  }
}
