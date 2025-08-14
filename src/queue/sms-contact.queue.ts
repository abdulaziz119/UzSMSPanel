import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { SmsContactService } from '../service/sms-contact.service';
import { SMS_CONTACT_QUEUE } from '../constants/constants';
import * as XLSX from 'xlsx';

export interface ImportExcelJobData {
  buffer: string;
  defaults: { default_group_id: number };
  meta?: Record<string, any>;
}

@Processor(SMS_CONTACT_QUEUE)
@Injectable()
export class SmsContactQueue {
  private readonly logger = new Logger(SmsContactQueue.name);

  constructor(private readonly smsContactService: SmsContactService) {
    this.logger.log(
      `SMS Contact Queue processor initialized for queue: ${SMS_CONTACT_QUEUE}`,
    );
  }

  @Process({ name: 'import-excel', concurrency: 2 })
  async importContactsFromExcel(job: Job<ImportExcelJobData>): Promise<{
    result: {
      total: number;
      inserted: number;
      failed: number;
      errors: Array<{ row: number; error: string }>;
    };
  }> {
    const BATCH_SIZE = 100;

    try {
      const fileBuffer = Buffer.from(job.data.buffer || '', 'base64');

      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName: string = workbook.SheetNames[0];

      if (!sheetName) {
        this.logger.warn('No sheet found in uploaded file');
        return { result: { total: 0, inserted: 0, failed: 0, errors: [] } };
      }

      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (!Array.isArray(rows) || rows.length === 0) {
        this.logger.warn('No data rows detected in the first sheet');
        return { result: { total: 0, inserted: 0, failed: 0, errors: [] } };
      }

      let inserted: number = 0;
      const errors: Array<{ row: number; error: string }> = [];

      for (let i: number = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);

        const batchPromises = batch.map(async (r, batchIndex) => {
          const rowIndex: number = i + batchIndex;

          const name = (r.name || r.Name || r.Nomi || '').toString().trim();
          const phone = (r.phone || r.Phone || r.Telefon || '')
            .toString()
            .trim();

          if (!name || !phone) {
            return {
              success: false as const,
              error: {
                row: rowIndex + 2,
                error: 'Missing required fields (name/phone)',
              },
            };
          }

          try {
            const cleanPhone = (phone || '').replace(/^\+/, '');

            await this.smsContactService.create({
              name,
              phone: cleanPhone,
              group_id: Number(job.data?.defaults?.default_group_id || 0),
            });

            return { success: true as const };
          } catch (e: any) {
            return {
              success: false as const,
              error: {
                row: rowIndex + 2,
                error: e?.message || 'Failed to insert',
              },
            };
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((res) => {
          if (res.status === 'fulfilled') {
            if (res.value.success) inserted++;
            else errors.push(res.value.error);
          } else {
            errors.push({ row: i + 2, error: String(res.reason) });
          }
        });

        const processed = Math.min(i + BATCH_SIZE, rows.length);
        const progress = Math.round((processed / rows.length) * 100);
        await job.progress(progress);
      }

      return {
        result: {
          total: rows.length,
          inserted,
          failed: rows.length - inserted,
          errors,
        },
      };
    } catch (error: any) {
      throw new HttpException(
        { message: 'Import failed', error: error?.message || String(error) },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
