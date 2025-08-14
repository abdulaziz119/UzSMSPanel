import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
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
  constructor(private readonly smsContactService: SmsContactService) {}

  @Process('import-excel')
  async handleImportExcel(job: Job<ImportExcelJobData>) {
    const { buffer, defaults } = job.data;

    try {
      const result = await this.smsContactService.importContactsFromExcel(
        buffer,
        defaults,
      );

      // You can add progress updates here if needed
      await job.progress(100);

      return result;
    } catch (error) {
      throw error;
    }
  }
}
