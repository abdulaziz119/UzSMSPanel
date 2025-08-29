import {
  Controller,
  Post,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
  Body,
  HttpCode,
} from '@nestjs/common';
import { FileService } from '../../../../service/file.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileEntity } from '../../../../entity/file.entity';
import {
  FileCreateBodyDto,
  FileUploadDto,
  FileUploadResponseDto,
} from '../../../../utils/dto/file.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../../../../utils/enum/user.enum';
import { ErrorResourceDto } from '../../../../utils/dto/error.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import {
  PaginationParams,
  ParamIdDto,
  SingleResponse,
} from '../../../../utils/dto/dto';
import { PaginationResponse } from '../../../../utils/pagination.response';
import { FileCategory } from '../../../../utils/enum/file.enum';

@ApiBearerAuth()
@ApiTags('File')
@Controller('/frontend/file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  /**
   * Fayl yuklash (rasm va media) — multipart/form-data
   */
  @Post('/create')
  @UseInterceptors(FileInterceptor('file'))
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
        source: {
          type: 'string',
          enum: Object.values(FileCategory),
          description: 'File categories',
        },
      },
      required: ['file', 'file_category'],
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
  @Roles(UserRoleEnum.SUPER_ADMIN)
  @Auth()
  async create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|svg|webp)' }),
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() body: FileCreateBodyDto,
  ): Promise<{ success: boolean; message: string; data: {} }> {
    if (!file) {
      throw new BadRequestException('File is missing.');
    }
    return await this.fileService.create(body, file);
  }
}
