// import {
//   InjectQueue,
//   OnQueueCompleted,
//   OnQueueFailed,
//   OnQueueProgress,
//   OnQueueStalled,
//   Process,
//   Processor,
// } from '@nestjs/bull';
// import { Job, Queue } from 'bull';
// import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
// import { SmsContactService } from '../service/sms-contact.service';
// import { SMS_CONTACT_QUEUE } from '../constants/constants';
// import * as XLSX from 'xlsx';
//
// export interface ImportExcelJobData {
//   buffer: string;
//   defaults: { default_group_id: number };
//   meta?: Record<string, any>;
// }
//
// export interface CreateContactJobData {
//   name: string;
//   phone: string;
//   group_id: number;
//   rowIndex?: number;
// }
//
// @Processor(SMS_CONTACT_QUEUE)
// @Injectable()
// export class SmsContactQueue {
//   private readonly logger = new Logger(SmsContactQueue.name);
//
//   constructor(
//     private readonly smsContactService: SmsContactService,
//     @InjectQueue(SMS_CONTACT_QUEUE) private readonly contactQueue: Queue,
//   ) {
//     this.logger.log(
//       `SMS Contact Queue processor initialized for queue: ${SMS_CONTACT_QUEUE}`,
//     );
//   }
//
//   @Process({ name: 'create-contact', concurrency: 10 })
//   async createContact(job: Job<CreateContactJobData>): Promise<{
//     result: { success: boolean; contactId?: number; error?: string; rowIndex?: number };
//   }> {
//     try {
//       this.logger.log(`Processing create-contact job ${job.id} for row ${job.data.rowIndex || 'unknown'}`);
//
//       const { name, phone, group_id } = job.data;
//
//       const contact = await this.smsContactService.create({
//         name,
//         phone,
//         group_id
//       });
//
//       this.logger.log(`Successfully created contact for row ${job.data.rowIndex}: ${contact.result.name}`);
//
//       return {
//         result: {
//           success: true,
//           contactId: contact.result.id,
//           rowIndex: job.data.rowIndex
//         }
//       };
//     } catch (error: any) {
//       this.logger.error(`Failed to create contact for row ${job.data.rowIndex}: ${error.message}`);
//
//       return {
//         result: {
//           success: false,
//           error: error.message,
//           rowIndex: job.data.rowIndex
//         }
//       };
//     }
//   }
//
//   @Process({ name: 'import-excel', concurrency: 5 }) // Increased from 2 to 5
//   async importContactsFromExcel(job: Job<ImportExcelJobData>): Promise<{
//     result: {
//       total: number;
//       inserted: number;
//       skipped: number;
//       failed: number;
//       errors: Array<{ row: number; error: string }>;
//     };
//   }> {
//     try {
//       this.logger.log(`Processing import-excel job ${job.id}`);
//       await job.progress(0);
//       const fileBuffer = Buffer.from(job.data.buffer || '', 'base64');
//
//       const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
//       const sheetName: string = workbook.SheetNames[0];
//
//       if (!sheetName) {
//         this.logger.warn('No sheet found in uploaded file');
//         return {
//           result: { total: 0, inserted: 0, skipped: 0, failed: 0, errors: [] },
//         };
//       }
//
//       const sheet = workbook.Sheets[sheetName];
//       const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
//
//       if (!Array.isArray(rows) || rows.length === 0) {
//         this.logger.warn('No data rows detected in the first sheet');
//         return {
//           result: { total: 0, inserted: 0, skipped: 0, failed: 0, errors: [] },
//         };
//       }
//
//       let inserted: number = 0;
//       let skipped: number = 0;
//       let processed: number = 0;
//       const errors: Array<{ row: number; error: string }> = [];
//
//       const total = rows.length;
//
//       // Process all rows in parallel; update progress on each completion
//       const allPromises = rows.map(async (r, rowIndex) => {
//         const name = (r.name || r.Name || r.Nomi || '').toString().trim();
//         const phone = (r.phone || r.Phone || r.Telefon || '').toString().trim();
//
//         // Skip if name is empty (don't create contact)
//         if (!name) {
//           processed++;
//           await job.progress(
//             Math.min(99, Math.round((processed / total) * 100)),
//           );
//           return { success: true as const, skipped: true };
//         }
//
//         // Phone is required if name exists
//         if (!phone) {
//           processed++;
//           await job.progress(
//             Math.min(99, Math.round((processed / total) * 100)),
//           );
//           return {
//             success: false as const,
//             error: {
//               row: rowIndex + 2,
//               error: 'Missing required field (phone)',
//             },
//           };
//         }
//
//         try {
//           const cleanPhone = (phone || '').replace(/^\+/, '');
//
//           await this.smsContactService.create({
//             name,
//             phone: cleanPhone,
//             group_id: Number(job.data?.defaults?.default_group_id || 0),
//           });
//
//           processed++;
//           await job.progress(
//             Math.min(99, Math.round((processed / total) * 100)),
//           );
//           return { success: true as const };
//         } catch (e: any) {
//           processed++;
//           await job.progress(
//             Math.min(99, Math.round((processed / total) * 100)),
//           );
//           return {
//             success: false as const,
//             error: {
//               row: rowIndex + 2,
//               error: e?.message || 'Failed to insert',
//             },
//           };
//         }
//       });
//
//       // Process all results
//       const allResults = await Promise.allSettled(allPromises);
//
//       allResults.forEach((res, index) => {
//         if (res.status === 'fulfilled') {
//           if (res.value.success && !res.value.skipped) inserted++;
//           else if (res.value.success && res.value.skipped) skipped++;
//           else if (!res.value.success) errors.push(res.value.error);
//         } else {
//           errors.push({ row: index + 2, error: String(res.reason) });
//         }
//       });
//
//       // Update progress to 100%
//       await job.progress(100);
//
//       return {
//         result: {
//           total: rows.length,
//           inserted,
//           skipped,
//           failed: rows.length - inserted - skipped,
//           errors,
//         },
//       };
//     } catch (error: any) {
//       throw new HttpException(
//         { message: 'Import failed', error: error?.message || String(error) },
//         HttpStatus.INTERNAL_SERVER_ERROR,
//       );
//     }
//   }
//
//   // Queue lifecycle handlers (observability)
//   @OnQueueCompleted()
//   async onCompleted(job: Job) {
//     try {
//       this.logger.log(
//         `Completed sms-contact job ${job.id} of type ${job.name}`,
//       );
//       const counts = await this.contactQueue.getJobCounts();
//       this.logger.debug(
//         `Queue counts -> waiting: ${counts.waiting}, active: ${counts.active}, delayed: ${counts.delayed}`,
//       );
//     } catch (e) {
//       this.logger.warn(`onCompleted hook error: ${e?.message || e}`);
//     }
//   }
//
//   @OnQueueFailed()
//   onFailed(job: Job, err: any) {
//     this.logger.error(
//       `Failed sms-contact job ${job.id} (${job.name}): ${err?.message || err}`,
//     );
//   }
//
//   @OnQueueProgress()
//   onProgress(job: Job, progress: number) {
//     this.logger.verbose(
//       `Progress sms-contact job ${job.id} (${job.name}): ${progress}%`,
//     );
//   }
//
//   @OnQueueStalled()
//   onStalled(job: Job) {
//     this.logger.warn(`Stalled sms-contact job ${job.id} (${job.name})`);
//   }
// }
