import {
  InjectQueue,
  OnQueueCompleted,
  OnQueueFailed,
  OnQueueProgress,
  OnQueueStalled,
  Process,
  Processor,
} from '@nestjs/bull';
import { Job, Queue } from 'bull';
import {
  Injectable,
  Logger,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SMS_MESSAGE_QUEUE, MODELS } from '../constants/constants';
import { ContactTypeEnum } from '../utils/enum/contact.enum';
import { MessageService } from '../service/message.service';
import { SmsContactService } from '../service/sms-contact.service';
import { Repository } from 'typeorm';
import { SmsTemplateEntity } from '../entity/sms-template.entity';
import { SmsContactEntity } from '../entity/sms-contact.entity';
import { ContactEntity } from '../entity/contact.entity';
import { TemplateStatusEnum } from '../utils/enum/sms-template.enum';
import { SMSContactStatusEnum } from '../utils/enum/sms-contact.enum';
import { TariffEntity } from '../entity/tariffs.entity';
import {
  SendToContactJobData,
  SendToGroupJobData,
} from '../utils/interfaces/messages.interfaces';
import { MessageEntity } from '../entity/message.entity';
import {
  BulkSendJobResult,
  SendToContactJobResult,
  SendToGroupJobResult,
} from '../utils/interfaces/request/sms-sending.request.interfaces';
import { MobiUzSmppService } from '../service/mobi-uz.smpp.service';
import { SMPP_SOURCE_ADDR } from '../utils/env/env';

@Processor(SMS_MESSAGE_QUEUE)
@Injectable()
export class MessagesQueue {
  private readonly logger: Logger = new Logger(MessagesQueue.name);

  constructor(
    private readonly smsMessageService: MessageService,
    private readonly smsContactService: SmsContactService,
    private readonly smppService: MobiUzSmppService,
    @Inject(MODELS.SMS_TEMPLATE)
    private readonly smsTemplateRepo: Repository<SmsTemplateEntity>,
    @Inject(MODELS.SMS_CONTACT)
    private readonly smsContactRepo: Repository<SmsContactEntity>,
    @Inject(MODELS.CONTACT)
    private readonly contactRepo: Repository<ContactEntity>,
    @InjectQueue(SMS_MESSAGE_QUEUE) private readonly messageQueue: Queue,
  ) {
    this.logger.log(
      `Messages Queue processor initialized for queue: ${SMS_MESSAGE_QUEUE}`,
    );
  }

  private async getAvailableBudget(
    user_id: number,
    balance_type?: ContactTypeEnum,
  ): Promise<number> {
    if (balance_type) {
      const balanceColumn =
        balance_type === ContactTypeEnum.INDIVIDUAL
          ? 'individual_balance'
          : 'company_balance';

      const contact = await this.contactRepo.findOne({
        where: { user_id: user_id, type: balance_type },
        select: [balanceColumn],
      });
      return Number(contact?.[balanceColumn] || 0);
    }
    return 0;
  }

  @Process({ name: 'send-to-contact', concurrency: 3 })
  async sendMessageToContact(
    job: Job<SendToContactJobData>,
  ): Promise<SendToContactJobResult> {
    try {
      this.logger.log(
        `Processing send-to-contact job ${job.id} for user ${job.data.user_id}`,
      );
      const { payload, user_id, balance } = job.data;

      const getTemplate: SmsTemplateEntity = await this.smsTemplateRepo.findOne(
        {
          where: {
            content: payload.message,
            status: TemplateStatusEnum.ACTIVE,
          },
        },
      );
      if (!getTemplate) {
        throw new HttpException(
          { message: 'Template not found or inactive' },
          HttpStatus.NOT_FOUND,
        );
      }

      const normalizedPhone: string =
        await this.smsContactService.normalizePhone(payload.phone);
      const status: SMSContactStatusEnum =
        await this.smsContactService.validatePhoneNumber(normalizedPhone);
      if (status === SMSContactStatusEnum.INVALID_FORMAT) {
        throw new HttpException(
          'Invalid phone number format',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (status === SMSContactStatusEnum.BANNED_NUMBER) {
        throw new HttpException('Banned phone number', HttpStatus.BAD_REQUEST);
      }

      const tariff: TariffEntity | null =
        await this.smsContactService.resolveTariffForPhone(normalizedPhone);
      if (!tariff) {
        throw new HttpException(
          'Tariff not found for this phone number',
          HttpStatus.BAD_REQUEST,
        );
      }

      const partsCount: number = Math.max(
        1,
        Number(getTemplate.parts_count || 1),
      );
      const unitPrice: number = Number(tariff.price || 0);
      const totalCost: number = unitPrice * partsCount;

      await this.smppService.ensureConnection();

      const saved: MessageEntity =
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

      let smppPhone: string = normalizedPhone;
      if (smppPhone.startsWith('+')) {
        smppPhone = smppPhone.substring(1);
      }

      const smppParams = {
        source_addr_ton: 0, // TON = 0
        source_addr_npi: 1, // NPI = 1
        source_addr: SMPP_SOURCE_ADDR, // Source address from env
        dest_addr_ton: 1, // TON = 1
        dest_addr_npi: 1, // NPI = 1
        destination_addr: smppPhone, // Destination address (plus belgisiz)
        short_message: payload.message,
        service_type: '', // Bo'sh service type
        registered_delivery: 1, // Delivery receipt kerak
        data_coding: 0, // Default encoding
      };

      const smsResult = await this.smppService.sendSms(smppParams, saved.id);
      if (!smsResult.success) {
        throw new HttpException(
          'Failed to send SMS via SMPP',
          HttpStatus.BAD_REQUEST,
        );
      }

      await job.progress(100);

      this.logger.log(`Successfully sent message to contact: ${payload.phone}`);

      return {
        success: true,
        messageId: saved.id,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to send message to contact: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        error: error.message || 'Failed to send message',
      };
    }
  }

  @Process({ name: 'send-to-group', concurrency: 2 })
  async sendMessageToGroup(
    job: Job<SendToGroupJobData>,
  ): Promise<SendToGroupJobResult> {
    try {
      this.logger.log(
        `Processing send-to-group job ${job.id} for user ${job.data.user_id}, group ${job.data.payload.group_id}`,
      );
      const { payload, user_id, balance } = job.data;

      const getTemplate: SmsTemplateEntity = await this.smsTemplateRepo.findOne(
        {
          where: { content: payload.message },
        },
      );
      if (!getTemplate) {
        throw new HttpException('Template not found', HttpStatus.NOT_FOUND);
      }

      const contact: SmsContactEntity = await this.smsContactRepo.findOne({
        where: { group_id: payload.group_id },
      });
      const hasAny: boolean = !!contact;
      if (!hasAny) {
        throw new HttpException(
          'No contacts found for group',
          HttpStatus.NOT_FOUND,
        );
      }

      const data =
        await this.smsContactService.getValidContactsWithTariffsOptimized(
          payload.group_id,
        );

      type ContactWithTariff = {
        phone: string;
        tariff: TariffEntity;
        unitPrice: number;
      };
      const items: ContactWithTariff[] = data.map((d) => ({
        phone: d.contact.phone,
        tariff: d.tariff,
        unitPrice: Number(d.tariff.price || 0),
      }));
      if (items.length === 0) {
        throw new HttpException(
          'No valid contacts with tariffs in the group',
          HttpStatus.BAD_REQUEST,
        );
      }

      const partsCount: number = Math.max(
        1,
        Number(getTemplate.parts_count || 1),
      );

      const availableBudget: number = await this.getAvailableBudget(
        user_id,
        balance,
      );

      const sorted = items
        .slice()
        .sort((a, b): number => a.unitPrice - b.unitPrice);
      const picked: typeof items = [];
      let acc: number = 0;
      for (const it of sorted) {
        const cost: number = it.unitPrice * partsCount;
        if (acc + cost > availableBudget) break;
        acc += cost;
        picked.push(it);
      }

      if (picked.length === 0) {
        throw new HttpException(
          'Insufficient contact balance',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.smppService.ensureConnection();

      const smsSendResults: Array<{
        success: boolean;
        messageEntity?: MessageEntity;
      }> = [];
      for (const it of picked) {
        try {
          const normalizedPhone: string =
            await this.smsContactService.normalizePhone(it.phone);

          const messageData = {
            user_id,
            phone: it.phone,
            message: payload.message,
            operator: it.tariff.operator,
            sms_template_id: getTemplate.id,
            cost: it.unitPrice * partsCount,
            price_provider_sms: it.tariff.price_provider_sms,
            group_id: payload.group_id,
          };

          const savedMessage: MessageEntity =
            await this.smsMessageService.createSmsMessageWithBilling(
              messageData,
              getTemplate,
              balance,
              it.unitPrice * partsCount,
            );

          let smppPhone: string = normalizedPhone;
          if (smppPhone.startsWith('+')) {
            smppPhone = smppPhone.substring(1);
          }

          const smppParams = {
            source_addr_ton: 0, // TON = 0
            source_addr_npi: 1, // NPI = 1
            source_addr: SMPP_SOURCE_ADDR, // Source address from env
            dest_addr_ton: 1, // TON = 1
            dest_addr_npi: 1, // NPI = 1
            destination_addr: smppPhone, // Destination address (plus belgisiz)
            short_message: payload.message,
            service_type: '', // Bo'sh service type
            registered_delivery: 1, // Delivery receipt kerak
            data_coding: 0, // Default encoding
          };

          const smsResult = await this.smppService.sendSms(
            smppParams,
            savedMessage.id,
          );
          smsSendResults.push({
            success: smsResult.success,
            messageEntity: savedMessage,
          });
        } catch (error) {
          this.logger.error(
            `Failed to send SMS to ${it.phone}: ${error.message}`,
          );
          smsSendResults.push({ success: false });
        }
      }

      const messages: MessageEntity[] = smsSendResults
        .filter(
          (result): MessageEntity => result.success && result.messageEntity,
        )
        .map((result): MessageEntity => result.messageEntity);

      await job.progress(100);

      this.logger.log(
        `Successfully sent messages to group ${payload.group_id}: ${messages.length} messages within budget`,
      );
      return { success: true, messageCount: messages.length };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send messages to group',
      };
    }
  }

  @Process({ name: 'bulk-send', concurrency: 1 })
  async bulkSendMessages(
    job: Job<{
      contacts: Array<{ phone: string; message: string }>;
      user_id: number;
      meta?: Record<string, any>;
    }>,
  ): Promise<BulkSendJobResult> {
    try {
      this.logger.log(
        `Processing bulk-send job ${job.id} with ${job.data.contacts.length} contacts`,
      );

      let processed: number = 0;
      let failed: number = 0;
      const errors: Array<{ phone: string; error: string }> = [];

      const totalContacts: number = job.data.contacts.length;

      for (let i: number = 0; i < job.data.contacts.length; i++) {
        const contact: { phone: string; message: string } =
          job.data.contacts[i];

        try {
          await this.sendMessageToContact({
            id: `${job.id}-contact-${i}`,
            data: {
              payload: { phone: contact.phone, message: contact.message },
              user_id: job.data.user_id,
            },
            progress: async (): Promise<void> => {},
          } as any);

          processed++;
        } catch (error: any) {
          failed++;
          errors.push({
            phone: contact.phone,
            error: error.message || 'Failed to send',
          });
        }

        const progress: number = Math.round(((i + 1) / totalContacts) * 100);
        await job.progress(progress);
      }

      this.logger.log(
        `Bulk send completed: ${processed} processed, ${failed} failed`,
      );

      return {
        success: true,
        processed,
        failed,
        errors,
      };
    } catch (error: any) {
      this.logger.error(`Bulk send job failed: ${error.message}`, error.stack);

      return {
        success: false,
        processed: 0,
        failed: job.data.contacts.length,
        errors: [
          { phone: 'all', error: error.message || 'Bulk operation failed' },
        ],
      };
    }
  }

  @OnQueueCompleted()
  async onCompleted(job: Job): Promise<void> {
    try {
      this.logger.log(`Completed messages job ${job.id} of type ${job.name}`);
      const counts = await this.messageQueue.getJobCounts();
      this.logger.debug(
        `Queue counts -> waiting: ${counts.waiting}, active: ${counts.active}, delayed: ${counts.delayed}`,
      );
    } catch (e) {
      this.logger.warn(`onCompleted hook error: ${e?.message || e}`);
    }
  }

  @OnQueueFailed()
  onFailed(job: Job, err: any): void {
    this.logger.error(
      `Failed messages job ${job.id} (${job.name}): ${err?.message || err}`,
    );
  }

  @OnQueueProgress()
  onProgress(job: Job, progress: number): void {
    this.logger.verbose(
      `Progress messages job ${job.id} (${job.name}): ${progress}%`,
    );
  }

  @OnQueueStalled()
  onStalled(job: Job): void {
    this.logger.warn(`Stalled messages job ${job.id} (${job.name})`);
  }
}
