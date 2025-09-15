import {
  Controller,
  Post,
  Body,
  UploadedFile,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
  BadRequestException,
} from '@nestjs/common';
import { ExcelService } from '../../../service/excel.service';
import { Auth } from '../../../frontend/v1/modules/auth/decorators/auth.decorator';
import { Roles } from '../../../frontend/v1/modules/auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../utils/enum/user.enum';
import { SmsContactExcelService } from '../../../utils/sms.contact.excel.service';
import { SMS_CONTACT_QUEUE } from '../../../constants/constants';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Controller('excel')
export class ExcelController {
  constructor(
    private readonly excelService: ExcelService,
    @InjectQueue(SMS_CONTACT_QUEUE) private readonly smsContactQueue: Queue,
  ) {}

  @Post('/import-excel')
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async importExcel(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({
            fileType:
              /(application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|application\/vnd\.ms-excel|text\/csv)$/,
          }),
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() body: { default_group_id: number },
  ) {
    if (!file || !body) {
      throw new BadRequestException('File is missing.');
    }
    // Parse rows here to avoid Buffer serialization issues in Bull/Redis
    const rows = SmsContactExcelService.parseContacts(file.buffer);
    if (!rows.length) {
      return {
        success: true,
        message: 'No valid rows found in file',
        data: { jobId: null, created: 0, skipped: 0 },
      } as any;
    }

    // Queue the job for background processing with parsed rows
    const job = await this.smsContactQueue.add(
      'import-excel',
      { default_group_id: body.default_group_id, rows },
      {
        attempts: 3,
        removeOnComplete: true,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );

    return {
      success: true,
      message: 'Import queued',
      data: { jobId: job.id },
    } as any;
  }
}
