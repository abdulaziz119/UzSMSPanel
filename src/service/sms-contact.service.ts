import {
  Inject,
  Injectable,
  HttpException,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { parsePhoneNumberFromString, PhoneNumber } from 'libphonenumber-js';
import { MODELS } from '../constants/constants';
import { ParamIdDto, SingleResponse } from '../utils/dto/dto';
import { PaginationResponse } from '../utils/pagination.response';
import { getPaginationResponse } from '../utils/pagination.builder';
import { SmsContactEntity } from '../entity/sms-contact.entity';
import { TariffEntity } from '../entity/tariffs.entity';
import {
  CreateSmsContactDto,
  UpdateSmsContactDto,
  SmsContactFindAllDto,
} from '../utils/dto/sms-contact.dto';
import { SMSContactStatusEnum } from '../utils/enum/sms-contact.enum';
import { SmsGroupEntity } from '../entity/sms-group.entity';
import { BatchProcessor } from '../utils/batch-processor.util';
const XLSX = require('xlsx');
import { SmsContactExcelService, ParsedContactRow } from '../utils/sms.contact.excel.service';

@Injectable()
export class SmsContactService {
  constructor(
    @Inject(MODELS.SMS_CONTACT)
    private readonly smsContactRepo: Repository<SmsContactEntity>,
    @Inject(MODELS.TARIFFS)
    private readonly tariffRepo: Repository<TariffEntity>,
    @Inject(MODELS.SMS_GROUP)
    private readonly smsGroupRepo: Repository<SmsGroupEntity>,
  ) {}

  async validatePhoneNumber(phone: string): Promise<SMSContactStatusEnum> {
    const cleanPhone: string = (phone || '').toString().trim();

    try {
      let parsed = parsePhoneNumberFromString(cleanPhone);
      if (!parsed) parsed = parsePhoneNumberFromString(cleanPhone, 'UZ');

      if (!parsed || !parsed.isValid()) {
        return SMSContactStatusEnum.INVALID_FORMAT;
      }

      const national: string = (parsed.nationalNumber || '').toString();
      const candidates: string[] = [
        national.substring(0, 3),
        national.substring(0, 2),
      ].filter(Boolean);

      try {
        const tariff: TariffEntity = await this.tariffRepo.findOne({
          where: candidates.map((code) => ({ code })),
        });

        if (!tariff) {
          return SMSContactStatusEnum.BANNED_NUMBER;
        }

        return SMSContactStatusEnum.ACTIVE;
      } catch (error) {
        console.warn('Tariff check failed:', error);
        return SMSContactStatusEnum.BANNED_NUMBER;
      }
    } catch {
      return SMSContactStatusEnum.INVALID_FORMAT;
    }
  }

  async resolveTariffForPhone(phone: string): Promise<TariffEntity | null> {
    try {
      const normalized: string = await this.normalizePhone(phone);
      const parsed =
        parsePhoneNumberFromString(normalized) ||
        parsePhoneNumberFromString(normalized, 'UZ');
      const national = parsed ? parsed.nationalNumber || '' : '';
      const candidates: string[] = [
        national.substring(0, 3),
        national.substring(0, 2),
      ].filter(Boolean);
      const tariff: TariffEntity = await this.tariffRepo.findOne({
        where: candidates.map((code) => ({ code })),
      });
      return tariff || null;
    } catch (error) {
      return null;
    }
  }

  async getValidContactsWithTariffs(
    group_id: number,
  ): Promise<Array<{ contact: SmsContactEntity; tariff: TariffEntity }>> {
    const contacts: SmsContactEntity[] = await this.smsContactRepo.find({
      where: { group_id },
    });

    // For large contact groups, process in batches to avoid memory issues
    if (contacts.length > 500) {
      const results = await BatchProcessor.processBatch(
        contacts,
        100, // Process 100 contacts at a time
        async (batch) => {
          const batchResults: Array<{ contact: SmsContactEntity; tariff: TariffEntity }> = [];
          
          for (const contact of batch) {
            const normalizedPhone: string = await this.normalizePhone(contact.phone);
            const status = await this.validatePhoneNumber(normalizedPhone);
            if (status !== SMSContactStatusEnum.ACTIVE) continue;
            
            const tariff: TariffEntity = await this.resolveTariffForPhone(normalizedPhone);
            if (!tariff) continue;
            
            batchResults.push({ contact, tariff });
          }
          
          return batchResults;
        }
      );
      
      return results.flat();
    }

    // For smaller groups, process normally
    const out: Array<{ contact: SmsContactEntity; tariff: TariffEntity }> = [];
    for (const c of contacts) {
      const normalizedPhone: string = await this.normalizePhone(c.phone);
      const st = await this.validatePhoneNumber(normalizedPhone);
      if (st !== SMSContactStatusEnum.ACTIVE) continue;
      const tariff: TariffEntity =
        await this.resolveTariffForPhone(normalizedPhone);
      if (!tariff) continue;
      out.push({ contact: c, tariff });
    }
    return out;
  }

  async normalizePhone(phone: string) {
    try {
      let parsed = parsePhoneNumberFromString(phone);
      if (!parsed) parsed = parsePhoneNumberFromString(phone, 'UZ');
      if (parsed && parsed.isValid()) {
        return parsed.number;
      }
    } catch {}
    return phone;
  }

  async create(
    payload: CreateSmsContactDto,
  ): Promise<SingleResponse<SmsContactEntity>> {
    try {
      const smsGroupData: SmsGroupEntity = await this.smsGroupRepo.findOne({
        where: { id: payload.group_id },
      });
      if (!smsGroupData) {
        throw new NotFoundException('SMS Group not found');
      }

      const normalizedPhone: string = await this.normalizePhone(payload.phone);
      const status = await this.validatePhoneNumber(normalizedPhone);

      const newSmsContact: SmsContactEntity = this.smsContactRepo.create({
        name: payload.name,
        phone: (normalizedPhone || payload.phone || '').replace(/^\+/, ''),
        status: status,
        group_name: smsGroupData.title,
        group_id: payload.group_id,
      });

      const savedSmsContact: SmsContactEntity =
        await this.smsContactRepo.save(newSmsContact);

      await this.smsGroupRepo
        .createQueryBuilder()
        .update(SmsGroupEntity)
        .set({ contact_count: () => 'COALESCE(contact_count, 0) + 1' })
        .where('id = :id', { id: payload.group_id })
        .execute();

      return { result: savedSmsContact };
    } catch (error) {
      throw new HttpException(
        { message: 'Error creating SMS Contact', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async importFromExcel(file: Express.Multer.File, default_group_id: number): Promise<{ result: true; created: number; skipped: number }> {
    if (!file || !file.buffer) {
      throw new HttpException({ message: 'Invalid file' }, HttpStatus.BAD_REQUEST);
    }

    const rows: ParsedContactRow[] = SmsContactExcelService.parseContacts(file.buffer);
    if (!rows.length) return { result: true, created: 0, skipped: 0 };

    let created = 0;
    let skipped = 0;

    // Preload group data once
    const smsGroupData: SmsGroupEntity = await this.smsGroupRepo.findOne({ where: { id: default_group_id } });
    if (!smsGroupData) throw new NotFoundException('SMS Group not found');

    // Process in small batches to reduce DB overhead
    const batchSize = 200;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const toSave: SmsContactEntity[] = [];
      for (const r of batch) {
        const phoneNormalized: string = await this.normalizePhone(r.phone);
        if (!phoneNormalized) {
          skipped++;
          continue;
        }
        const status = await this.validatePhoneNumber(phoneNormalized);

        const entity = this.smsContactRepo.create({
          name: (r.name ?? null) as any,
          phone: (phoneNormalized || r.phone || '').replace(/^\+/, ''),
          status,
          group_name: smsGroupData.title,
          group_id: default_group_id,
        });
        toSave.push(entity);
      }
      if (toSave.length) {
        const saved = await this.smsContactRepo.save(toSave);
        created += saved.length;
      }
    }

    // Update group contact_count by created
    if (created > 0) {
      await this.smsGroupRepo
        .createQueryBuilder()
        .update(SmsGroupEntity)
        .set({ contact_count: () => `COALESCE(contact_count, 0) + ${created}` })
        .where('id = :id', { id: default_group_id })
        .execute();
    }

    return { result: true, created, skipped };
  }

  async findAll(
    payload: SmsContactFindAllDto,
  ): Promise<PaginationResponse<SmsContactEntity[]>> {
    const { page = 1, limit = 10, phone, status, name } = payload;
    const skip: number = (page - 1) * limit;

    try {
      const queryBuilder = this.smsContactRepo
        .createQueryBuilder('sms_contacts')
        .where('sms_contacts.id IS NOT NULL')
        .addSelect(['sms_contacts.phone']);

      if (phone) {
        queryBuilder.andWhere('sms_contacts.phone ILIKE :phone', {
          phone: `%${phone}%`,
        });
      }
      if (status) {
        queryBuilder.andWhere('sms_contacts.status = :status', { status });
      }
      if (name) {
        queryBuilder.andWhere('sms_contacts.name ILIKE :name', {
          name: `%${name}%`,
        });
      }

      const [smsContactData, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .orderBy('sms_contacts.created_at', 'DESC')
        .getManyAndCount();

      return getPaginationResponse<SmsContactEntity>(
        smsContactData,
        page,
        limit,
        total,
      );
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching SMS Contacts', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    payload: UpdateSmsContactDto,
  ): Promise<SingleResponse<SmsContactEntity>> {
    const { id, ...updateData } = payload as any;

    const smsContact: SmsContactEntity = await this.smsContactRepo.findOne({
      where: { id: id },
    });

    if (!smsContact) {
      throw new NotFoundException('SMS Contact not found');
    }

    try {
      if (updateData.phone) {
        const normalized: string = await this.normalizePhone(updateData.phone);
        updateData.status = await this.validatePhoneNumber(normalized);
        updateData.phone = normalized;
      }

      await this.smsContactRepo.update(id, updateData);
      const updatedSmsContact: SmsContactEntity =
        await this.smsContactRepo.findOne({
          where: { id: id },
        });
      return { result: updatedSmsContact };
    } catch (error) {
      throw new HttpException(
        { message: 'Error updating SMS Contact', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async delete(payload: ParamIdDto): Promise<{ result: true }> {
    const { id } = payload;
    await this.smsContactRepo.softDelete(id);
    return { result: true };
  }

  generateContactsTemplate(): Buffer {
    const headers = ['name', 'phone'];
    const data = [
      {
        name: 'Ali Valiyev',
        phone: '+998901234567',
      },
      {
        name: 'Laylo Karimova',
        phone: '998935554433',
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'contacts');
    const buffer: Buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    }) as unknown as Buffer;
    return buffer;
  }
}
