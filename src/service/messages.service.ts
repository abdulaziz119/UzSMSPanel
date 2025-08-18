// import {
//   BadRequestException,
//   Injectable,
//   NotFoundException,
// } from '@nestjs/common';
// import { SmsMessageEntity } from '../entity/sms-message.entity';
// import {
//   SendToContactDto,
//   SendToGroupDto,
// } from '../frontend/v1/modules/messages/dto/messages.dto';
// import { ContactTypeEnum } from '../utils/enum/contact.enum';
// import { SingleResponse } from '../utils/dto/dto';
// import { Repository } from 'typeorm';
// import { Inject } from '@nestjs/common';
// import { MODELS } from '../constants/constants';
// import { SmsTemplateEntity } from '../entity/sms-template.entity';
// import { TemplateStatusEnum } from '../utils/enum/sms-template.enum';
// import { SmsContactService } from './sms-contact.service';
// import { SMSContactStatusEnum } from '../utils/enum/sms-contact.enum';
// import { TariffEntity } from '../entity/tariffs.entity';
// import { SmsMessageService } from './sms-message.service';
// import { BatchProcessor } from '../utils/batch-processor.util';
// import { SmsContactEntity } from '../entity/sms-contact.entity';
//
// @Injectable()
// export class MessagesService {
//   constructor(
//     private readonly smsMessageService: SmsMessageService,
//     private readonly smsContactService: SmsContactService,
//     @Inject(MODELS.SMS_TEMPLATE)
//     private readonly smsTemplateRepo: Repository<SmsTemplateEntity>,
//     @Inject(MODELS.SMS_CONTACT)
//     private readonly smsContactRepo: Repository<SmsContactEntity>,
//   ) {}
//
//   async sendToContact(
//     payload: SendToContactDto,
//     user_id: number,
//     balance?: ContactTypeEnum,
//   ): Promise<SingleResponse<SmsMessageEntity>> {
//     // 1) Template lookup
//     const getTemplate = await this.smsTemplateRepo.findOne({
//       where: {
//         content: payload.message,
//         status: TemplateStatusEnum.ACTIVE,
//       },
//     });
//     if (!getTemplate)
//       throw new NotFoundException('Template not found or inactive');
//
//     // 2) Phone validation
//     const normalizedPhone: string = await this.smsContactService.normalizePhone(
//       payload.phone,
//     );
//
//     const status: SMSContactStatusEnum =
//       await this.smsContactService.validatePhoneNumber(normalizedPhone);
//
//     if (status === SMSContactStatusEnum.INVALID_FORMAT)
//       throw new BadRequestException('Invalid phone number format');
//     if (status === SMSContactStatusEnum.BANNED_NUMBER)
//       throw new BadRequestException('Banned phone number');
//
//     // 3) Tariff lookup
//     const tariff: TariffEntity | null =
//       await this.smsContactService.resolveTariffForPhone(normalizedPhone);
//     if (!tariff)
//       throw new NotFoundException('Tariff not found for this phone number');
//
//     // 4) Pricing calculation (unchanged)
//     const partsCount: number = Math.max(
//       1,
//       Number(getTemplate.parts_count || 1),
//     );
//     const unitPrice: number = Number(tariff.price || 0);
//     const totalCost: number = unitPrice * partsCount;
//
//     // 5) Create with billing
//     const savedSmsMessage =
//       await this.smsMessageService.createSmsMessageWithBilling(
//         {
//           user_id,
//           phone: payload.phone,
//           message: payload.message,
//           operator: tariff.operator,
//           sms_template_id: getTemplate.id,
//           cost: totalCost,
//           price_provider_sms: tariff.price_provider_sms,
//         },
//         getTemplate,
//         balance,
//         totalCost,
//       );
//
//     return { result: savedSmsMessage };
//   }
//
//   async sendToGroup(
//     payload: SendToGroupDto,
//     user_id: number,
//     balance?: ContactTypeEnum,
//   ): Promise<SingleResponse<SmsMessageEntity[]>> {
//     // 1) Template lookup
//     const getTemplate = await this.smsTemplateRepo.findOne({
//       where: { content: payload.message },
//     });
//     if (!getTemplate) throw new NotFoundException('Template not found');
//
//     // 2) Group existence check
//     const contact = await this.smsContactRepo.findOne({
//       where: { group_id: payload.group_id },
//     });
//     const hasAny = !!contact;
//     if (!hasAny) throw new NotFoundException('No contacts found for group');
//
//     // 3) Valid contacts with tariffs
//     const data = await this.smsContactService.getValidContactsWithTariffs(
//       payload.group_id,
//     );
//
//     type ContactWithTariff = {
//       phone: string;
//       tariff: TariffEntity;
//       unitPrice: number;
//     };
//
//     const items: ContactWithTariff[] = data.map((d) => ({
//       phone: d.contact.phone,
//       tariff: d.tariff,
//       unitPrice: Number(d.tariff.price || 0),
//     }));
//     if (items.length === 0)
//       throw new NotFoundException(
//         'No valid contacts with tariffs in the group',
//       );
//
//     // 4) Pricing total
//     const partsCount: number = Math.max(
//       1,
//       Number(getTemplate.parts_count || 1),
//     );
//     const totalCost = items.reduce(
//       (sum, it) => sum + it.unitPrice * partsCount,
//       0,
//     );
//
//     // 5) Optimized batch processing for very large groups
//     const BATCH_SIZE = 500; // Increased from 100 to 500
//     if (items.length > BATCH_SIZE) {
//       const messages = await BatchProcessor.processParallelBatches(
//         items,
//         BATCH_SIZE,
//         5, // 5 parallel batches instead of sequential
//         async (batch) => {
//           const batchSmsData = batch.map((it) => ({
//             user_id,
//             phone: it.phone,
//             message: payload.message,
//             operator: it.tariff.operator,
//             sms_template_id: getTemplate.id,
//             cost: it.unitPrice * partsCount,
//             price_provider_sms: it.tariff.price_provider_sms,
//             group_id: payload.group_id,
//           }));
//
//           return await this.smsMessageService.createBulkSmsMessagesWithBilling(
//             batchSmsData,
//             getTemplate,
//             balance,
//             batch.reduce((sum, it) => sum + it.unitPrice * partsCount, 0),
//           );
//         },
//       );
//
//       return { result: messages.flat() };
//     }
//
//     // 6) Regular bulk processing
//     const smsDataArray = items.map((it) => ({
//       user_id,
//       phone: it.phone,
//       message: payload.message,
//       operator: it.tariff.operator,
//       sms_template_id: getTemplate.id,
//       cost: it.unitPrice * partsCount,
//       price_provider_sms: it.tariff.price_provider_sms,
//       group_id: payload.group_id,
//     }));
//
//     const messages =
//       await this.smsMessageService.createBulkSmsMessagesWithBilling(
//         smsDataArray,
//         getTemplate,
//         balance,
//         totalCost,
//       );
//
//     return { result: messages };
//   }
// }
