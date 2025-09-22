import {
  Controller,
  Post,
  Body,
  BadRequestException,
  HttpCode,
} from '@nestjs/common';
import { ExcelService } from '../../../../service/excel.service';
import { SmsContactExcelService } from '../../../../utils/sms.contact.excel.service';
import { SMS_CONTACT_QUEUE } from '../../../../constants/constants';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PaginationParams } from '../../../../utils/dto/dto';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { ExcelEntity } from '../../../../entity/excel.entity';

@Controller('excel')
export class ExcelController {
  constructor(
    private readonly excelService: ExcelService,
    @InjectQueue(SMS_CONTACT_QUEUE) private readonly smsContactQueue: Queue,
  ) {}

  @Post('/import-excel')
  async importExcel(
    @Body()
    body: {
      file: string;
      fileName: string;
      fileType: string;
      default_group_id: number;
      user_id: number;
    },
  ) {
    if (
      !body.file ||
      !body.fileName ||
      !body.default_group_id ||
      !body.user_id
    ) {
      throw new BadRequestException('Required fields are missing.');
    }

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(body.file, 'base64');

    // Parse rows here to avoid Buffer serialization issues in Bull/Redis
    const rows = SmsContactExcelService.parseContacts(fileBuffer);
    if (!rows.length) {
      return {
        success: true,
        message: 'No valid rows found in file',
        data: {
          jobId: null,
          created: 0,
          skipped: 0,
          duplicates: 0,
          invalidFormat: 0,
        },
      } as any;
    }

    // Queue the job for background processing with parsed rows and file info
    const job = await this.smsContactQueue.add(
      'import-excel',
      {
        default_group_id: body.default_group_id,
        rows,
        user_id: body.user_id,
        fileName: body.fileName,
        fileType: body.fileType,
        totalRows: rows.length,
      },
      {
        attempts: 3,
        removeOnComplete: true,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );

    return {
      success: true,
      message:
        'Import queued successfully. Only Uzbekistan phone numbers will be processed. Duplicates and invalid formats will be skipped.',
      data: { jobId: job.id },
    };
  }

  @Post('/findAll')
  @HttpCode(200)
  async findAll(
    @Body() query: PaginationParams,
  ): Promise<PaginationResponse<ExcelEntity[]>> {
    return await this.excelService.findAll(query);
  }
}
