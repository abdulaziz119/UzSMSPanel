import {
  Inject,
  Injectable,
  HttpException,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
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
import { GroupEntity } from '../entity/group.entity';
const XLSX = require('xlsx');
import { ParsedContactRow } from '../utils/sms.contact.excel.service';

@Injectable()
export class SmsContactService {
  constructor(
    @Inject(MODELS.SMS_CONTACT)
    private readonly smsContactRepo: Repository<SmsContactEntity>,
    @Inject(MODELS.TARIFFS)
    private readonly tariffRepo: Repository<TariffEntity>,
    @Inject(MODELS.GROUP)
    private readonly groupRepo: Repository<GroupEntity>,
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
          where: candidates.map((code: string) => ({ code })),
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

  /**
   * Optimized version: fetch contacts once, pre-resolve all needed tariff codes with a single query,
   * and build results without per-contact DB calls. Significantly faster for large groups.
   */
  async getValidContactsWithTariffsOptimized(
    group_id: number,
  ): Promise<Array<{ contact: SmsContactEntity; tariff: TariffEntity }>> {
    // Fetch only needed fields
    const contacts: Pick<
      SmsContactEntity,
      'id' | 'phone' | 'group_id' | 'name' | 'status'
    >[] = await this.smsContactRepo.find({
      where: { group_id },
      select: {
        id: true,
        phone: true,
        group_id: true,
        name: true,
        status: true,
      },
    });

    if (!contacts.length) return [];

    // Normalize phones and compute candidate codes
    const normalizedList: Array<{
      contact: Pick<
        SmsContactEntity,
        'id' | 'phone' | 'group_id' | 'name' | 'status'
      >;
      national: string;
      codes: string[];
    }> = [];
    const codeSet = new Set<string>();

    for (const c of contacts) {
      const normalized: string = await this.normalizePhone(c.phone);
      try {
        const parsed =
          parsePhoneNumberFromString(normalized) ||
          parsePhoneNumberFromString(normalized, 'UZ');
        if (!parsed || !parsed.isValid()) continue;
        const national: string = (parsed.nationalNumber || '').toString();
        const codes: string[] = [
          national.substring(0, 3),
          national.substring(0, 2),
        ].filter(Boolean);
        for (const code of codes) codeSet.add(code);
        normalizedList.push({ contact: c, national, codes });
      } catch {
        // skip invalid
      }
    }

    if (!normalizedList.length) return [];

    // Fetch all tariffs for required codes in one query
    const codesArr: string[] = Array.from(codeSet);
    const tariffs: TariffEntity[] = await this.tariffRepo.find({
      where: { code: In(codesArr) },
    });
    const tariffByCode = new Map<string, TariffEntity>();
    for (const t of tariffs) {
      if (t.code) tariffByCode.set(t.code, t);
    }

    // Build results preferring 3-digit match then 2-digit
    const results: Array<{ contact: SmsContactEntity; tariff: TariffEntity }> =
      [];
    for (const row of normalizedList) {
      const [c3, c2] = row.codes;
      const tariff: TariffEntity =
        (c3 && tariffByCode.get(c3)) || (c2 && tariffByCode.get(c2));
      if (!tariff) continue;
      // Consider as ACTIVE when tariff exists (same semantics as previous path)
      results.push({ contact: row.contact as SmsContactEntity, tariff });
    }

    return results;
  }

  async normalizePhone(phone: string): Promise<string> {
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
      const smsGroupData: GroupEntity = await this.groupRepo.findOne({
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

      await this.groupRepo
        .createQueryBuilder()
        .update(GroupEntity)
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

  async createFromRows(
    rows: ParsedContactRow[],
    default_group_id: number,
  ): Promise<{ result: true; created: number; skipped: number }> {
    if (!rows || rows.length === 0)
      return { result: true, created: 0, skipped: 0 };

    let created: number = 0;
    let skipped: number = 0;

    // Preload group data once
    const smsGroupData: GroupEntity = await this.groupRepo.findOne({
      where: { id: default_group_id },
    });
    if (!smsGroupData) throw new NotFoundException('SMS Group not found');

    const batchSize = 200;
    for (let i: number = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const toSave: SmsContactEntity[] = [];
      for (const r of batch) {
        const phoneNormalized: string = await this.normalizePhone(r.phone);
        if (!phoneNormalized) {
          skipped++;
          continue;
        }
        const status = await this.validatePhoneNumber(phoneNormalized);
        const entity: SmsContactEntity = this.smsContactRepo.create({
          name: (r.name ?? null) as any,
          phone: (phoneNormalized || r.phone || '').replace(/^\+/, ''),
          status,
          group_name: smsGroupData.title,
          group_id: default_group_id,
        });
        toSave.push(entity);
      }
      if (toSave.length) {
        const saved: SmsContactEntity[] =
          await this.smsContactRepo.save(toSave);
        created += saved.length;
      }
    }

    if (created > 0) {
      await this.groupRepo
        .createQueryBuilder()
        .update(GroupEntity)
        .set({
          contact_count: (): string =>
            `COALESCE(contact_count, 0) + ${created}`,
        })
        .where('id = :id', { id: default_group_id })
        .execute();
    }

    return { result: true, created, skipped };
  }

  async findAll(
    payload: SmsContactFindAllDto,
  ): Promise<PaginationResponse<SmsContactEntity[]>> {
    const { page = 1, limit = 10, phone, status, name, group_id } = payload;
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
      if (group_id) {
        queryBuilder.andWhere('sms_contacts.group_id = :group_id', {
          group_id,
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
