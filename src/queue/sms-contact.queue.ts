import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { SmsContactService } from '../service/sms-contact.service';
import { SMS_CONTACT_QUEUE } from '../constants/constants';

export interface ImportExcelJobData {
  buffer: Buffer;
  defaults: { default_group_id: number };
  userId?: number;
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

  @Process('import-excel')
  async handleImportExcel(job: Job<ImportExcelJobData>) {
    const { buffer: rawBuffer, defaults } = job.data as any;

    const buffer: Buffer = Buffer.isBuffer(rawBuffer)
      ? (rawBuffer as Buffer)
      : rawBuffer?.type === 'Buffer' && Array.isArray(rawBuffer?.data)
        ? Buffer.from(rawBuffer.data)
        : typeof rawBuffer === 'string'
          ? (() => {
              try {
                return Buffer.from(rawBuffer, 'base64');
              } catch {
                return Buffer.alloc(0);
              }
            })()
          : Buffer.alloc(0);

    this.logger.log(`Excel import job started - Job ID: ${job.id}`);

    try {
      this.logger.log(`🔄 Starting Excel import process...`);
      await job.progress(10);

      const result = await this.smsContactService.importContactsFromExcel(
        buffer,
        defaults,
      );

      // Update progress to 100%
      await job.progress(100);

      this.logger.log(
        `Excel import completed successfully - Job ID: ${job.id}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `❌ Excel import failed - Job ID: ${job.id}, Error: ${error?.message ?? error}`,
      );
      throw error;
    }
  }
}
