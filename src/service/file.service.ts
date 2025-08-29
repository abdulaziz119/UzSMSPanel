import {
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  IMAGES_URL,
  MEDIA_DIRECTORY,
  MY_GO_URL,
  SERVER_BASE_URL,
} from '../utils/env/env';
import { MODELS } from 'src/constants/constants';
import { Repository } from 'typeorm';
import mime from 'mime';
import { FileCreateBodyDto, FileUploadDto } from '../utils/dto/file.dto';
import { PaginationParams, ParamIdDto, SingleResponse } from '../utils/dto/dto';
import { PaginationResponse } from '../utils/pagination.response';
import { getPaginationResponse } from '../utils/pagination.builder';
import { UserEntity } from '../entity/user.entity';
import { FileType, FileVisibility } from '../utils/enum/file.enum';
import { FileEntity } from '../entity/file.entity';
import { AxiosService } from '../helpers/axios.service';

@Injectable()
export class FileService {
  private url: string = IMAGES_URL;
  private readonly mediaDirectory: string;
  private readonly serverBaseUrl: string;

  constructor(
    @Inject(MODELS.USER)
    private readonly axiosService: AxiosService,
  ) {}

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async create(
    payload: FileCreateBodyDto,
    file: Express.Multer.File,
  ): Promise<{ success: boolean; message: string; data: {} }> {
    try {
      const uploadDir: string = path.join(
        process.cwd(),
        this.mediaDirectory,
        'file',
      );
      await this.ensureDirectoryExists(uploadDir);

      const fileExtension: string = path
        .extname(file.originalname)
        .substring(1)
        .toLowerCase();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const filePath: string = path.join(uploadDir, uniqueFileName);

      await fs.writeFile(filePath, file.buffer);

      const url: string = `${this.url}/file/upload`;
      const file: any = await this.axiosService.sendPostFileRequest(url);

      return {
        success: true,
        message: 'File uploaded successfully.',
        data: {
          id: file.id,
          public_url: file.url,
        },
      };
    } catch (error) {
      throw new HttpException(
        { message: 'Error while uploading file', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
