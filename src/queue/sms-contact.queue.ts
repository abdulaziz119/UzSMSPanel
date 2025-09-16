import {
  OnQueueCompleted,
  OnQueueFailed,
  OnQueueProgress,
  OnQueueStalled,
  Process,
  Processor,
} from '@nestjs/bull';
import { Job } from 'bull';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { SMS_CONTACT_QUEUE } from '../constants/constants';
import { SmsContactService } from '../service/sms-contact.service';
import { ExcelService } from '../service/excel.service';
import {
  SmsContactExcelService,
  ParsedContactRow,
} from '../utils/sms.contact.excel.service';

@Processor(SMS_CONTACT_QUEUE)
@Injectable()
export class SmsContactQueue {
  private readonly logger = new Logger(SmsContactQueue.name);

  constructor(
    private readonly smsContactService: SmsContactService,
    private readonly excelService: ExcelService,
  ) {
    this.logger.log(
      `SmsContact Queue processor initialized for queue: ${SMS_CONTACT_QUEUE}`,
    );
  }

  // Job data shape
  // {
  //   default_group_id: number,
  //   fileBuffer?: Buffer,
  //   rows?: ParsedContactRow[],
  //   user_id?: number,
  //   fileName?: string,
  //   fileType?: string,
  //   totalRows?: number
  // }

  @Process({ name: 'import-excel', concurrency: 5 })
  async importContactsFromExcel(
    job: Job<{
      default_group_id: number;
      fileBuffer?: Buffer;
      rows?: ParsedContactRow[];
      user_id?: number;
      fileName?: string;
      fileType?: string;
      totalRows?: number;
    }>,
  ): Promise<{
    created: number;
    skipped: number;
    duplicates: number;
    invalidFormat: number;
    excelAnalysisId?: number;
  }> {
    this.logger.log(`Processing import-excel job ${job.id}`);
    const {
      default_group_id,
      fileBuffer,
      rows,
      user_id,
      fileName,
      fileType,
      totalRows,
    } = job.data || ({} as any);

    if (!default_group_id) {
      throw new HttpException(
        'default_group_id is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Step 1: Create Excel analysis record
    let excelAnalysisId: number | undefined;
    if (user_id && fileName && fileType && totalRows) {
      try {
        const excelAnalysis = await this.excelService.createExcelAnalysis({
          user_id,
          fileName,
          fileType,
          totalRows,
          status: 'processing',
        });
        excelAnalysisId = excelAnalysis.id;
        this.logger.log(`Excel analysis created: ${excelAnalysisId}`);
      } catch (error) {
        this.logger.error(`Failed to create Excel analysis: ${error.message}`);
        // Continue without Excel analysis if creation fails
      }
    }

    // Step 2: Parse rows if not provided
    let parsedRows: ParsedContactRow[] = rows || [];
    if (!parsedRows.length && fileBuffer) {
      let buf: Buffer | null = null;
      // Handle { type: 'Buffer', data: [...] }
      if (typeof fileBuffer === 'object' && Array.isArray(fileBuffer.data)) {
        buf = Buffer.from(fileBuffer.data);
      } else if (typeof fileBuffer === 'string') {
        // base64 string case
        try {
          buf = Buffer.from(fileBuffer, 'base64');
        } catch {}
      }
      if (buf && buf.length) {
        parsedRows = SmsContactExcelService.parseContacts(buf);
      }
    }

    if (!parsedRows.length) {
      // Update Excel analysis if no rows found
      if (excelAnalysisId) {
        await this.excelService.updateExcelAnalysis(excelAnalysisId, {
          status: 'completed',
          processedRows: 0,
          createdRows: 0,
          invalidFormatRows: 0,
          duplicateRows: 0,
        });
      }
      return { created: 0, skipped: 0, duplicates: 0, invalidFormat: 0, excelAnalysisId };
    }

    // Step 3: Process SMS contacts
    job.progress(10);
    const res = await this.smsContactService.createFromRows(
      parsedRows,
      default_group_id,
    );
    job.progress(100);

    this.logger.log(
      `Job ${job.id} completed: created=${res.created}, skipped=${res.skipped}, duplicates=${res.duplicates}, invalidFormat=${res.invalidFormat}`,
    );

    return {
      created: res.created,
      skipped: res.skipped,
      duplicates: res.duplicates,
      invalidFormat: res.invalidFormat,
      excelAnalysisId,
    };
  }

  @OnQueueProgress()
  onProgress(job: Job, progress: number) {
    this.logger.debug(`Job ${job.id} progress: ${progress}%`);
  }

  @OnQueueCompleted()
  async onCompleted(
    job: Job,
    result: { created: number; skipped: number; duplicates: number; invalidFormat: number; excelAnalysisId?: number },
  ) {
    this.logger.log(`Job ${job.id} completed successfully`);

    if (result.excelAnalysisId) {
      try {
        // Update Excel analysis with final results
        await this.excelService.updateExcelAnalysis(result.excelAnalysisId, {
          processedRows: result.created + result.skipped + result.duplicates + result.invalidFormat,
          createdRows: result.created,
          invalidFormatRows: result.invalidFormat,
          duplicateRows: result.duplicates,
          status: 'completed',
        });

        this.logger.log(
          `Excel analysis ${result.excelAnalysisId} updated: created=${result.created}, skipped=${result.skipped}, duplicates=${result.duplicates}, invalidFormat=${result.invalidFormat}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to update Excel analysis ${result.excelAnalysisId}: ${error.message}`,
        );
      }
    }
  }

  @OnQueueFailed()
  async onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);

    // Try to get excelAnalysisId from job data or result
    const { excelAnalysisId } = job.data || {};

    if (excelAnalysisId) {
      try {
        // Update Excel analysis with failed status
        await this.excelService.updateExcelAnalysis(excelAnalysisId, {
          status: 'failed',
        });

        this.logger.log(`Excel analysis ${excelAnalysisId} marked as failed`);
      } catch (updateError) {
        this.logger.error(
          `Failed to update Excel analysis ${excelAnalysisId} status: ${updateError.message}`,
        );
      }
    }
  }

  @OnQueueStalled()
  onStalled(job: Job) {
    this.logger.warn(`Job ${job.id} stalled`);
  }
}
