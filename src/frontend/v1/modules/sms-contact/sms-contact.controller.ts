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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiBadRequestResponse,
  ApiConsumes,
  ApiBody,
  ApiResponse,
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
} from '../../../../utils/dto/sms-contact.dto';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@ApiBearerAuth()
@ApiTags('sms-contact')
@Controller({ path: '/frontend/sms-contact', version: '1' })
export class SmsContactController {
  constructor(private readonly smsContactService: SmsContactService) {}

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
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Excel import (xlsx/xls/csv) with a single group id for all rows',
    required: true,
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        default_group_id: { type: 'number', example: 1 },
      },
      required: ['file', 'default_group_id'],
    },
  })
  @ApiBadRequestResponse({ type: ErrorResourceDto })
  @Auth(false)
  async importExcel(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({
            fileType:
              /(application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|application\/vnd\.ms-excel|text\/csv)$/i,
          }),
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() body: { default_group_id: number },
  ): Promise<{
    result: {
      total: number;
      inserted: number;
      failed: number;
      errors: Array<{ row: number; error: string }>;
    };
  }> {
    return await this.smsContactService.importContactsFromExcel(
      file.buffer,
      body,
    );
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
