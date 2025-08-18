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

  constructor(
    private readonly smsContactService: SmsContactService,
    @InjectQueue(SMS_CONTACT_QUEUE) private readonly contactQueue: Queue,
  ) {
    this.logger.log(
      `SMS Contact Queue processor initialized for queue: ${SMS_CONTACT_QUEUE}`,
    );
  }

  @Process({ name: 'import-excel', concurrency: 5 }) // Increased from 2 to 5
  async importContactsFromExcel(job: Job<ImportExcelJobData>): Promise<{
    result: {
      total: number;
      inserted: number;
      skipped: number;
      failed: number;
      errors: Array<{ row: number; error: string }>;
    };
  }> {
    try {
      this.logger.log(`Processing import-excel job ${job.id}`);
      await job.progress(0);
      const fileBuffer = Buffer.from(job.data.buffer || '', 'base64');

      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName: string = workbook.SheetNames[0];

      if (!sheetName) {
        this.logger.warn('No sheet found in uploaded file');
        return {
          result: { total: 0, inserted: 0, skipped: 0, failed: 0, errors: [] },
        };
      }

      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (!Array.isArray(rows) || rows.length === 0) {
        this.logger.warn('No data rows detected in the first sheet');
        return {
          result: { total: 0, inserted: 0, skipped: 0, failed: 0, errors: [] },
        };
      }

      let inserted = 0;
      let skipped = 0;
      const errors: Array<{ row: number; error: string }> = [];
      let lastProgress = 0;
      let errorsLogged = 0;
      const maxErrorsToLog = 20;

      for (let i = 0; i < totalRows; i++) {
        const r = rows[i];
        const rowIndex = i + 2; // Account for header row

        const name = (r.name || r.Name || r.Nomi || '').toString().trim();
        const phone = (r.phone || r.Phone || r.Telefon || '').toString().trim();

        // Skip if name is empty (don't create contact)
        if (!name) {
          skipped++;
          continue;
        }

        // Phone is required if name exists
        if (!phone) {
          errors.push({
            row: rowIndex,
            error: 'Missing required field (phone)',
          });
          continue;
        }

        try {
          const cleanPhone = phone.replace(/^\+/, '');

          await this.smsContactService.create({
            name,
            phone: cleanPhone,
            group_id: Number(job.data?.defaults?.default_group_id || 0),
          });
          inserted++;
        } catch (e: any) {
          const errorMessage =
            e?.code === '23505'
              ? 'Duplicate phone number'
              : e?.message || 'Unknown error';
          // Log the specific error for debugging, but only for the first few
          if (errorsLogged < maxErrorsToLog) {
            this.logger.warn(
              `[${job.id}] Failed to insert row ${rowIndex}: ${errorMessage}`,
            );
            errorsLogged++;
          }
          errors.push({ row: rowIndex, error: errorMessage });
        }

        // Throttle progress updates
        const progress = Math.min(99, Math.round(((inserted + skipped) / total) * 100));
        if (progress !== lastProgress) {
          await job.progress(progress);
          lastProgress = progress;
        }
      }

      // Update progress to 100%
      await job.progress(100);

      return {
        result: {
          total: rows.length,
          inserted,
          skipped,
          failed: rows.length - inserted - skipped,
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

  // Queue lifecycle handlers (observability)
  @OnQueueCompleted()
  async onCompleted(job: Job) {
    try {
      this.logger.log(
        `Completed sms-contact job ${job.id} of type ${job.name}`,
      );
      const counts = await this.contactQueue.getJobCounts();
      this.logger.debug(
        `Queue counts -> waiting: ${counts.waiting}, active: ${counts.active}, delayed: ${counts.delayed}`,
      );
    } catch (e) {
      this.logger.warn(`onCompleted hook error: ${e?.message || e}`);
    }
  }

  @OnQueueFailed()
  onFailed(job: Job, err: any) {
    this.logger.error(
      `Failed sms-contact job ${job.id} (${job.name}): ${err?.message || err}`,
    );
  }

  @OnQueueProgress()
  onProgress(job: Job, progress: number) {
    this.logger.verbose(
      `Progress sms-contact job ${job.id} (${job.name}): ${progress}%`,
    );
  }

  @OnQueueStalled()
  onStalled(job: Job) {
    this.logger.warn(`Stalled sms-contact job ${job.id} (${job.name})`);
  }
}
