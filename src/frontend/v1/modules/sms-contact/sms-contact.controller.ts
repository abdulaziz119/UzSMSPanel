import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
  Res,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiBadRequestResponse,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { SingleResponse, ParamIdDto } from '../../../../utils/dto/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { SmsContactEntity } from '../../../../entity/sms-contact.entity';
import { SmsContactService } from '../../../../service/sms-contact.service';
import {
  CreateSmsContactDto,
  UpdateSmsContactDto,
  SmsContactFindAllDto,
  BulkCreateSmsContactDto,
} from '../../../../utils/dto/sms-contact.dto';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SMS_CONTACT_QUEUE } from '../../../../constants/constants';
import { FileUploadResponseDto } from '../../../../utils/dto/file.dto';
import * as multer from 'multer';
import { SmsContactExcelService } from '../../../../utils/sms.contact.excel.service';

@ApiBearerAuth()
@ApiTags('sms-contact')
@Controller({ path: '/frontend/sms-contact', version: '1' })
export class SmsContactController {
  constructor(
    private readonly smsContactService: SmsContactService,
    @InjectQueue(SMS_CONTACT_QUEUE) private readonly smsContactQueue: Queue,
  ) {}

  @Post('/create')
  @HttpCode(201)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async create(
    @Body() body: CreateSmsContactDto,
  ): Promise<SingleResponse<SmsContactEntity>> {
    return await this.smsContactService.create(body);
  }

  @Post('/bulk-create')
  @HttpCode(201)
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async bulkCreate(@Body() body: BulkCreateSmsContactDto) {
    return await this.smsContactService.bulkCreate(body.contacts);
  }

  @Post('/findAll')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async findAll(
    @Body() query: SmsContactFindAllDto,
  ): Promise<PaginationResponse<SmsContactEntity[]>> {
    return await this.smsContactService.findAll(query);
  }

  @Post('/update')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async update(
    @Body() body: UpdateSmsContactDto,
  ): Promise<SingleResponse<SmsContactEntity>> {
    return await this.smsContactService.update(body);
  }

  @Post('/delete')
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Roles(UserRoleEnum.CLIENT)
  @Auth(false)
  async delete(@Body() param: ParamIdDto): Promise<{ result: true }> {
    return await this.smsContactService.delete(param);
  }

  @Post('/import-excel')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiOperation({
    summary: 'Contact lar ni excel da yuklash (multipart/form-data)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload',
    required: true,
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        default_group_id: { type: 'number', example: 1 },
      },
      required: ['file', 'default_group_id'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: FileUploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid file type or size',
  })
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

  @Post('/download-template')
  @ApiResponse({
    status: 200,
    description: 'Excel template (xlsx) for contacts import',
    schema: { type: 'string', format: 'binary' },
  })
  @Auth(false)
  async downloadTemplate(@Res() res: Response) {
    const buffer = this.smsContactService.generateContactsTemplate();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="sms_contacts_template.xlsx"',
    );
    return res.send(buffer);
  }
}
