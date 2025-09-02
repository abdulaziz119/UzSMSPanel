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
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { SMS_MESSAGE_QUEUE, MODELS } from '../constants/constants';
import { ContactTypeEnum } from '../utils/enum/contact.enum';
import { MessageService } from '../service/message.service';
import { SmsContactService } from '../service/sms-contact.service';
import { Repository } from 'typeorm';
import { SmsTemplateEntity } from '../entity/sms-template.entity';
import { SmsContactEntity } from '../entity/sms-contact.entity';
import { UserEntity } from '../entity/user.entity';
import { ContactEntity } from '../entity/contact.entity';
import { TemplateStatusEnum } from '../utils/enum/sms-template.enum';
import { SMSContactStatusEnum } from '../utils/enum/sms-contact.enum';
import { TariffEntity } from '../entity/tariffs.entity';
import {
  SendToContactJobData,
  SendToGroupJobData,
} from '../utils/interfaces/messages.interfaces';
import { MessageEntity } from '../entity/message.entity';

@Processor(SMS_MESSAGE_QUEUE)
@Injectable()
export class MessagesQueue {
  private readonly logger = new Logger(MessagesQueue.name);

  constructor(
    private readonly smsMessageService: MessageService,
    private readonly smsContactService: SmsContactService,
    @Inject(MODELS.SMS_TEMPLATE)
    private readonly smsTemplateRepo: Repository<SmsTemplateEntity>,
    @Inject(MODELS.SMS_CONTACT)
    private readonly smsContactRepo: Repository<SmsContactEntity>,
    @Inject(MODELS.USER)
    private readonly userRepo: Repository<UserEntity>,
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
    balance?: ContactTypeEnum,
  ): Promise<number> {
    if (balance) {
      const row = await this.contactRepo
        .createQueryBuilder('c')
        .select('COALESCE(SUM(c.balance), 0)', 'sum')
        .where('c.user_id = :user_id', { user_id })
        .andWhere('c.type = :type', { type: balance })
        .andWhere('c.status = :status', { status: 'active' })
        .getRawOne<{ sum: string }>();
      return Number(row?.sum || 0);
    }
    const user = await this.userRepo.findOne({ where: { id: user_id } });
    return Number(user?.balance || 0);
  }

  @Process({ name: 'send-to-contact', concurrency: 3 })
  async sendMessageToContact(job: Job<SendToContactJobData>): Promise<{
    success: boolean;
    messageId?: number;
    error?: string;
  }> {
    try {
      this.logger.log(
        `Processing send-to-contact job ${job.id} for user ${job.data.user_id}`,
      );
      const { payload, user_id, balance } = job.data;

      // 1) Template lookup
      const getTemplate = await this.smsTemplateRepo.findOne({
        where: { content: payload.message, status: TemplateStatusEnum.ACTIVE },
      });
      if (!getTemplate) {
        throw new NotFoundException('Template not found or inactive');
      }

      // 2) Phone validation
      const normalizedPhone: string =
        await this.smsContactService.normalizePhone(payload.phone);
      const status: SMSContactStatusEnum =
        await this.smsContactService.validatePhoneNumber(normalizedPhone);
      if (status === SMSContactStatusEnum.INVALID_FORMAT)
        throw new BadRequestException('Invalid phone number format');
      if (status === SMSContactStatusEnum.BANNED_NUMBER)
        throw new BadRequestException('Banned phone number');

      // 3) Tariff lookup
      const tariff: TariffEntity | null =
        await this.smsContactService.resolveTariffForPhone(normalizedPhone);
      if (!tariff)
        throw new NotFoundException('Tariff not found for this phone number');

      // 4) Pricing calculation
      const partsCount: number = Math.max(
        1,
        Number(getTemplate.parts_count || 1),
      );
      const unitPrice: number = Number(tariff.price || 0);
      const totalCost: number = unitPrice * partsCount;

      // 5) Create with billing
      const saved = await this.smsMessageService.createSmsMessageWithBilling(
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
  async sendMessageToGroup(job: Job<SendToGroupJobData>): Promise<{
    success: boolean;
    messageCount?: number;
    error?: string;
  }> {
    try {
      this.logger.log(
        `Processing send-to-group job ${job.id} for user ${job.data.user_id}, group ${job.data.payload.group_id}`,
      );
      const { payload, user_id, balance } = job.data;

      // 1) Template lookup
      const getTemplate: SmsTemplateEntity = await this.smsTemplateRepo.findOne(
        {
          where: { content: payload.message },
        },
      );
      if (!getTemplate) throw new NotFoundException('Template not found');

      // 2) Group existence check
      const contact: SmsContactEntity = await this.smsContactRepo.findOne({
        where: { group_id: payload.group_id },
      });
      const hasAny: boolean = !!contact;
      if (!hasAny) throw new NotFoundException('No contacts found for group');

      // 3) Valid contacts with tariffs (optimized)
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
      if (items.length === 0)
        throw new NotFoundException(
          'No valid contacts with tariffs in the group',
        );

      // 4) Pricing
      const partsCount: number = Math.max(
        1,
        Number(getTemplate.parts_count || 1),
      );

      // 5) Compute available budget by header balance type or user balance
      const availableBudget: number = await this.getAvailableBudget(
        user_id,
        balance,
      );
      // Sort by unit price ascending to maximize count within budget
      const sorted = items.slice().sort((a, b) => a.unitPrice - b.unitPrice);
      const picked: typeof items = [];
      let acc: number = 0;
      for (const it of sorted) {
        const cost: number = it.unitPrice * partsCount;
        if (acc + cost > availableBudget) break;
        acc += cost;
        picked.push(it);
      }

      if (picked.length === 0) {
        throw new BadRequestException('Insufficient contact balance');
      }

      // 6) Single transactional bulk create with internal chunking
      const smsDataArray = picked.map((it) => ({
        user_id,
        phone: it.phone,
        message: payload.message,
        operator: it.tariff.operator,
        sms_template_id: getTemplate.id,
        cost: it.unitPrice * partsCount,
        price_provider_sms: it.tariff.price_provider_sms,
        group_id: payload.group_id,
      }));

      const messages: MessageEntity[] =
        await this.smsMessageService.createBulkSmsMessagesWithBilling(
          smsDataArray,
          getTemplate,
          balance,
          acc,
        );

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
  ): Promise<{
    success: boolean;
    processed: number;
    failed: number;
    errors: Array<{ phone: string; error: string }>;
  }> {
    try {
      this.logger.log(
        `Processing bulk-send job ${job.id} with ${job.data.contacts.length} contacts`,
      );

      let processed: number = 0;
      let failed: number = 0;
      const errors: Array<{ phone: string; error: string }> = [];

      const totalContacts: number = job.data.contacts.length;

      for (let i: number = 0; i < job.data.contacts.length; i++) {
        const contact = job.data.contacts[i];

        try {
          await this.sendMessageToContact({
            id: `${job.id}-contact-${i}`,
            data: {
              payload: { phone: contact.phone, message: contact.message },
              user_id: job.data.user_id,
            },
            progress: async () => {},
          } as any);

          processed++;
        } catch (error: any) {
          failed++;
          errors.push({
            phone: contact.phone,
            error: error.message || 'Failed to send',
          });
        }

        // Update progress
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

  // Queue lifecycle handlers (for observability and optional flow control)
  @OnQueueCompleted()
  async onCompleted(job: Job) {
    try {
      this.logger.log(`Completed messages job ${job.id} of type ${job.name}`);
      // Optionally inspect counts
      const counts = await this.messageQueue.getJobCounts();
      this.logger.debug(
        `Queue counts -> waiting: ${counts.waiting}, active: ${counts.active}, delayed: ${counts.delayed}`,
      );
      // Example pause logic (disabled by default):
      // if (!(counts.waiting || counts.active || counts.delayed)) {
      //   await this.messageQueue.pause();
      // }
    } catch (e) {
      this.logger.warn(`onCompleted hook error: ${e?.message || e}`);
    }
  }

  @OnQueueFailed()
  onFailed(job: Job, err: any) {
    this.logger.error(
      `Failed messages job ${job.id} (${job.name}): ${err?.message || err}`,
    );
  }

  @OnQueueProgress()
  onProgress(job: Job, progress: number) {
    this.logger.verbose(
      `Progress messages job ${job.id} (${job.name}): ${progress}%`,
    );
  }

  @OnQueueStalled()
  onStalled(job: Job) {
    this.logger.warn(`Stalled messages job ${job.id} (${job.name})`);
  }
}
