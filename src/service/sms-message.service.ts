import {
  Inject,
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { MODELS } from '../constants/constants';
import { SmsMessageEntity } from '../entity/sms-message.entity';
import { UserEntity } from '../entity/user.entity';
import { SingleResponse } from '../utils/dto/dto';
import { PaginationResponse } from '../utils/pagination.response';
import { getPaginationResponse } from '../utils/pagination.builder';
import { MessageStatusEnum } from '../utils/enum/sms-message.enum';
import { MessageTypeEnum } from '../utils/enum/sms-price.enum';
import {
  MessageFilterDto,
  MessageStatsDto,
  SmsHistoryFilterDto,
} from '../utils/dto/sms-message.dto';
import { SmsContactEntity } from '../entity/sms-contact.entity';
import { SendToContactDto } from '../frontend/v1/modules/messages/dto/messages.dto';
import { SmsContactService } from './sms-contact.service';
import { SMSContactStatusEnum } from '../utils/enum/sms-contact.enum';
import { TariffEntity } from '../entity/tariffs.entity';
import { SmsTemplateEntity } from '../entity/sms-template.entity';

@Injectable()
export class SmsMessageService {
  constructor(
    @Inject(MODELS.SMS_MESSAGE)
    private readonly messageRepo: Repository<SmsMessageEntity>,
    @Inject(MODELS.USER)
    private readonly userRepo: Repository<UserEntity>,
    @Inject(MODELS.SMS_TEMPLATE)
    private readonly smsTemplateRepo: Repository<SmsTemplateEntity>,
    @Inject(MODELS.TARIFFS)
    private readonly tariffRepo: Repository<TariffEntity>,
    @Inject(MODELS.SMS_CONTACT)
    private readonly smsContactRepo: Repository<SmsContactEntity>,
    private readonly smsContactService: SmsContactService,
  ) {}

  // Send to single contact by contact_id
  async sendToContact(
    payload: SendToContactDto,
    user_id: number,
  ): Promise<SingleResponse<SmsMessageEntity>> {
    try {
      const getTemplate: SmsTemplateEntity = await this.smsTemplateRepo.findOne(
        {
          where: { content: payload.message },
        },
      );
      if (!getTemplate) {
        throw new NotFoundException('Template not found');
      }

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
      // Determine tariff for the phone and write operator to message
      const parsed =
        parsePhoneNumberFromString(normalizedPhone) ||
        parsePhoneNumberFromString(normalizedPhone, 'UZ');

      const national = parsed ? parsed.nationalNumber || '' : '';
      const candidates: string[] = [national.substring(0, 2)].filter(Boolean);

      const tariff: TariffEntity = await this.tariffRepo.findOne({
        where: [...candidates.map((code) => ({ code }))],
      });

      if (!tariff) {
        throw new NotFoundException('Tariff not found for this phone number');
      }

      const partsCount: number = Math.max(
        1,
        Number(getTemplate.parts_count || 1),
      );
      const unitPrice: number = Number(tariff.price || 0);
      const totalCost: number = unitPrice * partsCount;

      const res: SmsMessageEntity = this.messageRepo.create({
        user_id: user_id,
        phone: payload.phone,
        message: payload.message,
        status: MessageStatusEnum.SENT,
        message_type: MessageTypeEnum.SMS,
        operator: tariff.operator,
        sms_template_id: getTemplate.id,
        cost: totalCost,
      });
      const savedSmsMessage: SmsMessageEntity =
        await this.messageRepo.save(res);

      await this.smsTemplateRepo.update(
        { id: getTemplate.id },
        {
          usage_count: () => 'usage_count + 1',
          last_used_at: savedSmsMessage.created_at,
        },
      );
      return { result: savedSmsMessage };
    } catch (error) {
      throw error;
    }
  }

  // Send to all contacts in a group (queued as bulk)
  // async sendToGroup(
  //   payload: {
  //     group_id: number;
  //     message: string;
  //     sender?: string;
  //     batch_size?: number;
  //   },
  //   user_id: number,
  // ): Promise<SingleResponse<{ job_id?: string }>> {
  //   try {
  //     // Fetch active contacts in group
  //     const contacts = await this.smsContactRepo.find({
  //       where: { group_id: payload.group_id },
  //     });
  //     if (!contacts || contacts.length === 0) {
  //       throw new NotFoundException('No contacts found for group');
  //     }
  //
  //     const phones = contacts.map((c) => c.phone).filter(Boolean);
  //
  //     const dto = {
  //       phones,
  //       message: payload.message,
  //       sender: payload.sender,
  //     } as any;
  //
  //     const res = await this.sendBulk(dto, user_id);
  //     return { result: { job_id: res.result.batch_id } } as any;
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  // async sendSingle(
  //   payload: SendSingleSmsDto,
  //   user_id: number,
  // ): Promise<SingleResponse<{ message_id: string; cost: number }>> {
  //   try {
  //     // Foydalanuvchini tekshirish
  //     const user = await this.userRepo.findOne({ where: { id: user_id } });
  //     if (!user) {
  //       throw new NotFoundException('User not found');
  //     }
  //
  //     // SMS narxini hisoblash
  //     const partsCount = Math.ceil(payload.message.length / 160);
  //     const smsPrice = this.calculateSmsPrice(
  //       payload.phone,
  //       payload.message_type,
  //     );
  //     const totalCost = partsCount * smsPrice;
  //
  //     // Balansni tekshirish
  //     if (user.balance < totalCost) {
  //       throw new BadRequestException('Insufficient balance');
  //     }
  //
  //     // Unique message ID yaratish
  //     const messageId = this.generateMessageId();
  //
  //     // SMS yaratish
  //     const smsMessage = this.messageRepo.create({
  //       user_id,
  //       message_id: messageId,
  //       phone: payload.phone,
  //       phone_ext: payload.phone_ext,
  //       message: payload.message,
  //       sender: payload.sender || 'UzSMS',
  //       status: MessageStatusEnum.PENDING,
  //       direction: MessageDirectionEnum.OUTBOUND,
  //       message_type: payload.message_type || MessageTypeEnum.SMS,
  //       operator: this.detectOperator(payload.phone),
  //       parts_count: partsCount,
  //       cost: totalCost,
  //     });
  //
  //     const savedMessage = await this.messageRepo.save(smsMessage);
  //
  //     // Balansni yangilash
  //     await this.userRepo.update(user_id, {
  //       balance: user.balance - totalCost,
  //     });
  //
  //     // SMS yuborish (bu yerda real SMS provider bilan integratsiya bo'lishi kerak)
  //     await this.sendSmsToProvider(savedMessage);
  //
  //     return {
  //       result: {
  //         message_id: messageId,
  //         cost: totalCost,
  //       },
  //     };
  //   } catch (error) {
  //     throw new HttpException(
  //       { message: 'Error sending SMS', error: error.message },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  // async sendBulk(
  //   payload: SendBulkSmsDto,
  //   user_id: number,
  // ): Promise<
  //   SingleResponse<{
  //     batch_id: string;
  //     total_cost: number;
  //     messages_count: number;
  //   }>
  // > {
  //   try {
  //     // Foydalanuvchini tekshirish
  //     const user = await this.userRepo.findOne({ where: { id: user_id } });
  //     if (!user) {
  //       throw new NotFoundException('User not found');
  //     }
  //
  //     // Umumiy narxni hisoblash
  //     const partsCount = Math.ceil(payload.message.length / 160);
  //     let totalCost = 0;
  //
  //     for (const phone of payload.phones) {
  //       const smsPrice = this.calculateSmsPrice(phone, payload.message_type);
  //       totalCost += partsCount * smsPrice;
  //     }
  //
  //     // Balansni tekshirish
  //     if (user.balance < totalCost) {
  //       throw new BadRequestException('Insufficient balance');
  //     }
  //
  //     // Batch ID yaratish
  //     const batchId = this.generateBatchId();
  //
  //     // SMS xabarlarini yaratish
  //     const messages = [];
  //     for (const phone of payload.phones) {
  //       const messageId = this.generateMessageId();
  //       const smsPrice = this.calculateSmsPrice(phone, payload.message_type);
  //
  //       const smsMessage = this.messageRepo.create({
  //         user_id,
  //         message_id: messageId,
  //         batch_id: batchId,
  //         phone,
  //         message: payload.message,
  //         sender: payload.sender || 'UzSMS',
  //         status: MessageStatusEnum.PENDING,
  //         direction: MessageDirectionEnum.OUTBOUND,
  //         message_type: payload.message_type || MessageTypeEnum.SMS,
  //         operator: this.detectOperator(phone),
  //         parts_count: partsCount,
  //         cost: partsCount * smsPrice,
  //       });
  //
  //       messages.push(smsMessage);
  //     }
  //
  //     await this.messageRepo.save(messages);
  //
  //     // Balansni yangilash
  //     await this.userRepo.update(user_id, {
  //       balance: user.balance - totalCost,
  //     });
  //
  //     // SMS'larni yuborish
  //     for (const message of messages) {
  //       await this.sendSmsToProvider(message);
  //     }
  //
  //     return {
  //       result: {
  //         batch_id: batchId,
  //         total_cost: totalCost,
  //         messages_count: payload.phones.length,
  //       },
  //     };
  //   } catch (error) {
  //     throw new HttpException(
  //       { message: 'Error sending bulk SMS', error: error.message },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  // async getHistory(
  //   filters: SmsHistoryFilterDto,
  //   user_id: number,
  // ): Promise<PaginationResponse<SmsMessageEntity[]>> {
  //   const { page = 1, limit = 20 } = filters;
  //   const skip = (page - 1) * limit;
  //
  //   try {
  //     const queryBuilder = this.messageRepo
  //       .createQueryBuilder('message')
  //       .where('message.user_id = :user_id', { user_id })
  //       .orderBy('message.created_at', 'DESC');
  //
  //     // Filtrlarni qo'llash
  //     if (filters.date_from) {
  //       queryBuilder.andWhere('message.created_at >= :date_from', {
  //         date_from: filters.date_from,
  //       });
  //     }
  //
  //     if (filters.date_to) {
  //       queryBuilder.andWhere('message.created_at <= :date_to', {
  //         date_to: filters.date_to,
  //       });
  //     }
  //
  //     if (filters.status) {
  //       queryBuilder.andWhere('message.status = :status', {
  //         status: filters.status,
  //       });
  //     }
  //
  //     if (filters.phone) {
  //       queryBuilder.andWhere('message.phone LIKE :phone', {
  //         phone: `%${filters.phone}%`,
  //       });
  //     }
  //
  //     if (filters.sender) {
  //       queryBuilder.andWhere('message.sender = :sender', {
  //         sender: filters.sender,
  //       });
  //     }
  //
  //     const [messages, total] = await queryBuilder
  //       .skip(skip)
  //       .take(limit)
  //       .getManyAndCount();
  //
  //     return getPaginationResponse<SmsMessageEntity>(
  //       messages,
  //       page,
  //       limit,
  //       total,
  //     );
  //   } catch (error) {
  //     throw new HttpException(
  //       { message: 'Error fetching SMS history', error: error.message },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
  //
  // async getStatistics(user_id: number): Promise<SingleResponse<any>> {
  //   try {
  //     const totalSent = await this.messageRepo.count({
  //       where: { user_id },
  //     });
  //
  //     const delivered = await this.messageRepo.count({
  //       where: { user_id, status: MessageStatusEnum.DELIVERED },
  //     });
  //
  //     const failed = await this.messageRepo.count({
  //       where: { user_id, status: MessageStatusEnum.FAILED },
  //     });
  //
  //     const pending = await this.messageRepo.count({
  //       where: { user_id, status: MessageStatusEnum.PENDING },
  //     });
  //
  //     // Umumiy xarajat
  //     const result = await this.messageRepo
  //       .createQueryBuilder('message')
  //       .select('SUM(message.cost)', 'total_cost')
  //       .where('message.user_id = :user_id', { user_id })
  //       .getRawOne();
  //
  //     const statistics = {
  //       total_sent: totalSent,
  //       delivered,
  //       failed,
  //       pending,
  //       total_cost: parseFloat(result.total_cost) || 0,
  //       delivery_rate: totalSent > 0 ? (delivered / totalSent) * 100 : 0,
  //       success_rate:
  //         totalSent > 0 ? ((delivered / totalSent) * 100).toFixed(2) : '0',
  //     };
  //
  //     return { result: statistics };
  //   } catch (error) {
  //     throw new HttpException(
  //       { message: 'Error fetching SMS statistics', error: error.message },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
  //
  // async updateMessageStatus(
  //   message_id: string,
  //   status: MessageStatusEnum,
  //   delivery_report?: any,
  // ): Promise<void> {
  //   try {
  //     const updateData: any = { status };
  //
  //     if (status === MessageStatusEnum.SENT) {
  //       updateData.sent_at = new Date();
  //     } else if (status === MessageStatusEnum.DELIVERED) {
  //       updateData.delivered_at = new Date();
  //     }
  //
  //     if (delivery_report) {
  //       updateData.delivery_report = delivery_report;
  //     }
  //
  //     await this.messageRepo.update({ message_id }, updateData);
  //   } catch (error) {
  //     throw new HttpException(
  //       { message: 'Error updating message status', error: error.message },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  // private calculateSmsPrice(
  //   phone: string,
  //   messageType?: MessageTypeEnum,
  // ): number {
  //   // SMS narxini operator va tip bo'yicha hisoblash
  //   const operator = this.detectOperator(phone);
  //
  //   // Soddalashtirilgan narx tizimi
  //   const basePrices = {
  //     [OperatorEnum.BEELINE]: 100,
  //     [OperatorEnum.UCELL]: 105,
  //     [OperatorEnum.UMS]: 110,
  //     [OperatorEnum.PERFECTUM]: 115,
  //     [OperatorEnum.HUMANS]: 120,
  //   };
  //
  //   return basePrices[operator] || 100; // Default narx
  // }
  //
  // private detectOperator(phone: string): OperatorEnum {
  //   // Telefon raqam bo'yicha operatorni aniqlash
  //   const phoneNumber = phone.replace(/\D/g, ''); // Faqat raqamlar
  //
  //   if (phoneNumber.startsWith('99890') || phoneNumber.startsWith('99891')) {
  //     return OperatorEnum.BEELINE;
  //   } else if (
  //     phoneNumber.startsWith('99893') ||
  //     phoneNumber.startsWith('99894')
  //   ) {
  //     return OperatorEnum.UCELL;
  //   } else if (
  //     phoneNumber.startsWith('99895') ||
  //     phoneNumber.startsWith('99896')
  //   ) {
  //     return OperatorEnum.UMS;
  //   } else if (
  //     phoneNumber.startsWith('99897') ||
  //     phoneNumber.startsWith('99898')
  //   ) {
  //     return OperatorEnum.PERFECTUM;
  //   } else if (phoneNumber.startsWith('99899')) {
  //     return OperatorEnum.HUMANS;
  //   }
  //
  //   return OperatorEnum.BEELINE; // Default
  // }
  //
  // private generateMessageId(): string {
  //   return `MSG_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  // }
  //
  // private generateBatchId(): string {
  //   return `BATCH_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  // }

  // Dashboard-specific methods
  // async getMessageHistory(
  //   filters: MessageFilterDto,
  // ): Promise<PaginationResponse<SmsMessageEntity[]>> {
  //   try {
  //     const queryBuilder = this.messageRepo
  //       .createQueryBuilder('message')
  //       .leftJoinAndSelect('message.user', 'user');
  //
  //     // Apply filters
  //     if (filters.status) {
  //       queryBuilder.andWhere('message.status = :status', {
  //         status: filters.status,
  //       });
  //     }
  //
  //     if (filters.phone) {
  //       queryBuilder.andWhere('message.phone ILIKE :phone', {
  //         phone: `%${filters.phone}%`,
  //       });
  //     }
  //
  //     if (filters.sender) {
  //       queryBuilder.andWhere('message.sender ILIKE :sender', {
  //         sender: `%${filters.sender}%`,
  //       });
  //     }
  //
  //     if (filters.user_id) {
  //       queryBuilder.andWhere('message.user_id = :user_id', {
  //         user_id: filters.user_id,
  //       });
  //     }
  //
  //     if (filters.operator) {
  //       queryBuilder.andWhere('message.operator = :operator', {
  //         operator: filters.operator,
  //       });
  //     }
  //
  //     if (filters.direction) {
  //       queryBuilder.andWhere('message.direction = :direction', {
  //         direction: filters.direction,
  //       });
  //     }
  //
  //     if (filters.date_from) {
  //       queryBuilder.andWhere('message.created_at >= :date_from', {
  //         date_from: filters.date_from,
  //       });
  //     }
  //
  //     if (filters.date_to) {
  //       queryBuilder.andWhere('message.created_at <= :date_to', {
  //         date_to: filters.date_to,
  //       });
  //     }
  //
  //     if (filters.search) {
  //       queryBuilder.andWhere(
  //         '(message.message ILIKE :search OR message.phone ILIKE :search)',
  //         { search: `%${filters.search}%` },
  //       );
  //     }
  //
  //     queryBuilder.orderBy('message.created_at', 'DESC');
  //
  //     const total = await queryBuilder.getCount();
  //
  //     if (filters.page && filters.limit) {
  //       queryBuilder
  //         .skip((filters.page - 1) * filters.limit)
  //         .take(filters.limit);
  //     }
  //
  //     const messages = await queryBuilder.getMany();
  //
  //     return getPaginationResponse(
  //       messages,
  //       total,
  //       filters.page || 1,
  //       filters.limit || 10,
  //     );
  //   } catch (error) {
  //     throw new HttpException(
  //       { message: 'Error fetching message history', error: error.message },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
  //
  // async getMessageDetails(
  //   id: number,
  // ): Promise<SingleResponse<SmsMessageEntity>> {
  //   try {
  //     const message = await this.messageRepo.findOne({
  //       where: { id },
  //       relations: ['user'],
  //     });
  //
  //     if (!message) {
  //       throw new NotFoundException('Message not found');
  //     }
  //
  //     return { result: message };
  //   } catch (error) {
  //     if (error instanceof NotFoundException) {
  //       throw error;
  //     }
  //     throw new HttpException(
  //       { message: 'Error fetching message details', error: error.message },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
  //
  // async getMessageStatistics(
  //   filters: MessageStatsDto,
  // ): Promise<SingleResponse<any>> {
  //   try {
  //     const queryBuilder = this.messageRepo.createQueryBuilder('message');
  //
  //     if (filters.date_from) {
  //       queryBuilder.andWhere('message.created_at >= :date_from', {
  //         date_from: filters.date_from,
  //       });
  //     }
  //
  //     if (filters.date_to) {
  //       queryBuilder.andWhere('message.created_at <= :date_to', {
  //         date_to: filters.date_to,
  //       });
  //     }
  //
  //     if (filters.user_id) {
  //       queryBuilder.andWhere('message.user_id = :user_id', {
  //         user_id: filters.user_id,
  //       });
  //     }
  //
  //     if (filters.operator) {
  //       queryBuilder.andWhere('message.operator = :operator', {
  //         operator: filters.operator,
  //       });
  //     }
  //
  //     const statistics = await queryBuilder
  //       .select([
  //         'COUNT(*) as total_messages',
  //         'SUM(CASE WHEN status = :sent THEN 1 ELSE 0 END) as sent_count',
  //         'SUM(CASE WHEN status = :delivered THEN 1 ELSE 0 END) as delivered_count',
  //         'SUM(CASE WHEN status = :failed THEN 1 ELSE 0 END) as failed_count',
  //         'SUM(CASE WHEN status = :pending THEN 1 ELSE 0 END) as pending_count',
  //         'SUM(cost) as total_cost',
  //         'SUM(parts_count) as total_parts',
  //         'AVG(cost) as average_cost',
  //         'ROUND(AVG(CASE WHEN delivered_at IS NOT NULL AND sent_at IS NOT NULL THEN EXTRACT(EPOCH FROM (delivered_at - sent_at)) ELSE NULL END), 2) as avg_delivery_time',
  //       ])
  //       .setParameters({
  //         sent: MessageStatusEnum.SENT,
  //         delivered: MessageStatusEnum.DELIVERED,
  //         failed: MessageStatusEnum.FAILED,
  //         pending: MessageStatusEnum.PENDING,
  //       })
  //       .getRawOne();
  //
  //     // Calculate delivery rate
  //     const delivered = parseInt(statistics.delivered_count) || 0;
  //     const total = parseInt(statistics.total_messages) || 0;
  //     const delivery_rate = total > 0 ? (delivered / total) * 100 : 0;
  //
  //     const result = {
  //       ...statistics,
  //       delivery_rate: parseFloat(delivery_rate.toFixed(2)),
  //       success_rate: parseFloat(delivery_rate.toFixed(2)),
  //     };
  //
  //     return { result };
  //   } catch (error) {
  //     throw new HttpException(
  //       { message: 'Error fetching message statistics', error: error.message },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
  //
  // async resendMessage(
  //   id: number,
  // ): Promise<SingleResponse<{ message: string }>> {
  //   try {
  //     const message = await this.messageRepo.findOne({ where: { id } });
  //
  //     if (!message) {
  //       throw new NotFoundException('Message not found');
  //     }
  //
  //     if (message.status === MessageStatusEnum.DELIVERED) {
  //       throw new BadRequestException('Cannot resend delivered message');
  //     }
  //
  //     // Reset message status and resend
  //     await this.messageRepo.update(id, {
  //       status: MessageStatusEnum.PENDING,
  //       sent_at: null,
  //       delivered_at: null,
  //       updated_at: new Date(),
  //     });
  //
  //     // Trigger resend
  //     const updatedMessage = await this.messageRepo.findOne({ where: { id } });
  //     await this.sendSmsToProvider(updatedMessage);
  //
  //     return { result: { message: 'Message resent successfully' } };
  //   } catch (error) {
  //     if (
  //       error instanceof NotFoundException ||
  //       error instanceof BadRequestException
  //     ) {
  //       throw error;
  //     }
  //     throw new HttpException(
  //       { message: 'Error resending message', error: error.message },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
  //
  // async bulkResend(
  //   message_ids: number[],
  // ): Promise<SingleResponse<{ message: string; resent_count: number }>> {
  //   try {
  //     let resent_count = 0;
  //
  //     for (const id of message_ids) {
  //       try {
  //         await this.resendMessage(id);
  //         resent_count++;
  //       } catch (error) {
  //         // Continue with other messages if one fails
  //         console.error(`Failed to resend message ${id}:`, error.message);
  //       }
  //     }
  //
  //     return {
  //       result: {
  //         message: 'Bulk resend completed',
  //         resent_count,
  //       },
  //     };
  //   } catch (error) {
  //     throw new HttpException(
  //       { message: 'Error performing bulk resend', error: error.message },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
  //
  // async getOperatorStatistics(
  //   filters: MessageStatsDto,
  // ): Promise<SingleResponse<any>> {
  //   try {
  //     const queryBuilder = this.messageRepo.createQueryBuilder('message');
  //
  //     if (filters.date_from) {
  //       queryBuilder.andWhere('message.created_at >= :date_from', {
  //         date_from: filters.date_from,
  //       });
  //     }
  //
  //     if (filters.date_to) {
  //       queryBuilder.andWhere('message.created_at <= :date_to', {
  //         date_to: filters.date_to,
  //       });
  //     }
  //
  //     if (filters.user_id) {
  //       queryBuilder.andWhere('message.user_id = :user_id', {
  //         user_id: filters.user_id,
  //       });
  //     }
  //
  //     const operatorStats = await queryBuilder
  //       .select([
  //         'message.operator as operator',
  //         'COUNT(*) as total_messages',
  //         'SUM(CASE WHEN status = :delivered THEN 1 ELSE 0 END) as delivered_count',
  //         'SUM(CASE WHEN status = :failed THEN 1 ELSE 0 END) as failed_count',
  //         'SUM(cost) as total_cost',
  //         'AVG(cost) as average_cost',
  //       ])
  //       .setParameters({
  //         delivered: MessageStatusEnum.DELIVERED,
  //         failed: MessageStatusEnum.FAILED,
  //       })
  //       .groupBy('message.operator')
  //       .getRawMany();
  //
  //     // Calculate delivery rates for each operator
  //     const result = operatorStats.map((stat) => ({
  //       ...stat,
  //       delivery_rate:
  //         stat.total_messages > 0
  //           ? parseFloat(
  //               ((stat.delivered_count / stat.total_messages) * 100).toFixed(2),
  //             )
  //           : 0,
  //     }));
  //
  //     return { result };
  //   } catch (error) {
  //     throw new HttpException(
  //       { message: 'Error fetching operator statistics', error: error.message },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
  //
  // private async sendSmsToProvider(message: SmsMessageEntity): Promise<void> {
  //   try {
  //     // Bu yerda real SMS provider API'si chaqiriladi
  //     // Masalan: Eskiz.uz, Play Mobile, SMS.uz va boshqalar
  //
  //     // Simulyatsiya uchun
  //     setTimeout(async () => {
  //       // Tasodifiy muvaffaqiyat/muvaffaqiyatsizlik
  //       const isSuccess = Math.random() > 0.1; // 90% muvaffaqiyat
  //
  //       if (isSuccess) {
  //         await this.updateMessageStatus(
  //           message.message_id,
  //           MessageStatusEnum.SENT,
  //         );
  //
  //         // Delivery report simulyatsiyasi
  //         setTimeout(async () => {
  //           const isDelivered = Math.random() > 0.05; // 95% yetkazib berish
  //           await this.updateMessageStatus(
  //             message.message_id,
  //             isDelivered
  //               ? MessageStatusEnum.DELIVERED
  //               : MessageStatusEnum.FAILED,
  //             { delivered_at: new Date() },
  //           );
  //         }, 2000);
  //       } else {
  //         await this.updateMessageStatus(
  //           message.message_id,
  //           MessageStatusEnum.FAILED,
  //           { error: 'Provider error' },
  //         );
  //       }
  //     }, 1000);
  //   } catch (error) {
  //     await this.updateMessageStatus(
  //       message.message_id,
  //       MessageStatusEnum.FAILED,
  //       { error: error.message },
  //     );
  //   }
  // }
}
