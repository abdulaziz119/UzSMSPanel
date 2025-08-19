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
import { SMS_CONTACT_QUEUE } from '../constants/constants';
import { SmsContactService } from '../service/sms-contact.service';
import {
  SmsContactExcelService,
  ParsedContactRow,
} from '../utils/sms.contact.excel.service';

@Processor(SMS_CONTACT_QUEUE)
@Injectable()
export class SmsContactQueue {
  private readonly logger = new Logger(SmsContactQueue.name);

  constructor(private readonly smsContactService: SmsContactService) {
    this.logger.log(`SmsContact Queue processor initialized for queue: ${SMS_CONTACT_QUEUE}`);
  }

  // Job data shape
  // {
  //   default_group_id: number,
  //   fileBuffer?: Buffer,
  //   rows?: ParsedContactRow[]
  // }

  @Process({ name: 'import-excel', concurrency: 5 })
  async importContactsFromExcel(
    job: Job<{
      default_group_id: number;
      fileBuffer?: Buffer;
      rows?: ParsedContactRow[];
    }>,
  ): Promise<{
    created: number;
    skipped: number;
  }> {
    this.logger.log(`Processing import-excel job ${job.id}`);
    const { default_group_id, fileBuffer, rows } = job.data || ({} as any);
    if (!default_group_id) {
      throw new HttpException(
        'default_group_id is required',
        HttpStatus.BAD_REQUEST,
      );
    }

      let parsedRows: ParsedContactRow[] = rows || [];
      if (!parsedRows.length && fileBuffer) {
        let buf: Buffer | null = null;
        // Handle { type: 'Buffer', data: [...] }
        if (typeof fileBuffer === 'object' && Array.isArray(fileBuffer.data)) {
          buf = Buffer.from(fileBuffer.data);
        } else if (typeof fileBuffer === 'string') {
          // base64 string case
          try { buf = Buffer.from(fileBuffer, 'base64'); } catch {}
        }
        if (buf && buf.length) {
          parsedRows = SmsContactExcelService.parseContacts(buf);
        }
    }
    if (!parsedRows.length) return { created: 0, skipped: 0 };

    job.progress(10);
    const res = await this.smsContactService.createFromRows(
      parsedRows,
      default_group_id,
    );
    job.progress(100);
    this.logger.log(
      `Job ${job.id} completed: created=${res.created}, skipped=${res.skipped}`,
    );
    return { created: res.created, skipped: res.skipped };
  }

  @OnQueueProgress()
  onProgress(job: Job, progress: number) {
    this.logger.debug(`Job ${job.id} progress: ${progress}%`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(
      `Job ${job.id} completed with result: ${JSON.stringify(result)}`,
    );
  }

  @OnQueueFailed()
  onFailed(job: Job, err: any) {
    this.logger.error(`Job ${job?.id} failed: ${err?.message || err}`);
  }

  @OnQueueStalled()
  onStalled(job: Job) {
    this.logger.warn(`Job ${job.id} stalled`);
  }
}
