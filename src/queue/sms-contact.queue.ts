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
      `🚀 SMS Contact Queue processor initialized for queue: ${SMS_CONTACT_QUEUE}`,
    );
  }

  @Process('import-excel')
  async handleImportExcel(job: Job<ImportExcelJobData>) {
    const { buffer, defaults } = job.data;

    this.logger.log(`📥 Excel import job started - Job ID: ${job.id}`);
    this.logger.log(
      `📊 Job data retrieved from Redis - Buffer size: ${buffer.length} bytes, Group ID: ${defaults.default_group_id}`,
    );
    this.logger.log(
      `⏰ Job timestamp: ${new Date(job.timestamp).toISOString()}`,
    );

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
        `✅ Excel import completed successfully - Job ID: ${job.id}`,
      );
      this.logger.log(`📈 Import result: ${JSON.stringify(result)}`);
      this.logger.log(`💾 Job result will be stored in Redis for retrieval`);

      return result;
    } catch (error) {
      this.logger.error(
        `❌ Excel import failed - Job ID: ${job.id}, Error: ${error.message}`,
      );
      throw error;
    }
  }
}
