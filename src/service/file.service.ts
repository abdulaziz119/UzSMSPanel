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
import { MEDIA_DIRECTORY, SERVER_BASE_URL } from '../utils/env/env';
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

@Injectable()
export class FileService {
  private readonly mediaDirectory: string;
  private readonly serverBaseUrl: string;

  constructor(
    @Inject(MODELS.FILE)
    private readonly fileRepo: Repository<FileEntity>,
    @Inject(MODELS.USER)
    private readonly userRepo: Repository<UserEntity>,
  ) {
    this.mediaDirectory = MEDIA_DIRECTORY || 'public';
    this.serverBaseUrl = SERVER_BASE_URL || 'http://localhost:3000';
  }

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

      const mimeType: string =
        file.mimetype ||
        mime.lookup(file.originalname) ||
        'application/octet-stream';
      const fileType: FileType = this.getFileTypeByMime(mimeType);
      const publicUrl = `${this.serverBaseUrl}/${this.mediaDirectory}/file/${uniqueFileName}`;

      const newFile: FileEntity = this.fileRepo.create({
        original_name: file.originalname,
        file_name: uniqueFileName,
        file_path: filePath,
        public_url: publicUrl,
        file_extension: fileExtension,
        mime_type: mimeType,
        file_type: fileType,
        file_category: payload.file_category,
        file_size: file.size,
        visibility: FileVisibility.PRIVATE,
      });

      const savedFile: FileEntity = await this.fileRepo.save(newFile);

      return {
        success: true,
        message: 'File uploaded successfully.',
        data: {
          id: savedFile.id,
          public_url: savedFile.public_url,
        },
      };
    } catch (error) {
      throw new HttpException(
        { message: 'Error while uploading file', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // async updateUser(user_id: number, file_id: number): Promise<void> {
  //   try {
  //     const user: UserEntity = await this.userRepo.findOne({
  //       where: { id: user_id, deleted_at: null },
  //     });
  //     if (user.file_id !== null) {
  //       await this.delete({ id: user.file_id });
  //     }
  //     if (!user) {
  //       throw new HttpException(
  //         { message: 'User not found' },
  //         HttpStatus.NOT_FOUND,
  //       );
  //     }
  //
  //     user.file_id = file_id;
  //     await this.userRepo.save(user);
  //   } catch (error) {
  //     throw new HttpException(
  //       { message: 'Error updating user', error: error.message },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  private getFileTypeByMime(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) {
      return FileType.IMAGE;
    }
    if (mimeType.startsWith('video/')) {
      return FileType.VIDEO;
    }
    if (mimeType.startsWith('audio/')) {
      return FileType.AUDIO;
    }
    if (
      mimeType === 'application/zip' ||
      mimeType === 'application/x-rar-compressed'
    ) {
      return FileType.ARCHIVE;
    }
    if (
      mimeType === 'application/pdf' ||
      mimeType.startsWith('application/msword') ||
      mimeType.startsWith('application/vnd')
    ) {
      return FileType.DOCUMENT;
    }
    return FileType.OTHER;
  }

  async findAll(
    payload: PaginationParams,
  ): Promise<PaginationResponse<FileEntity[]>> {
    const { page = 1, limit = 10 } = payload;
    const skip: number = (page - 1) * limit;

    try {
      const queryBuilder = this.fileRepo
        .createQueryBuilder('files')
        .where('files.id IS NOT NULL');

      const [unitData, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .orderBy('files.created_at', 'DESC')
        .getManyAndCount();

      return getPaginationResponse<FileEntity>(unitData, page, limit, total);
    } catch (error) {
      throw new HttpException(
        { message: 'Error fetching file', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(payload: FileUploadDto): Promise<SingleResponse<FileEntity>> {
    try {
      const file: FileEntity = await this.fileRepo.findOne({
        where: { id: payload.id, deleted_at: null },
      });

      if (!file) {
        throw new NotFoundException('file not found');
      }

      const updatedParticipant: FileEntity = this.fileRepo.merge(file, {
        original_name: payload.original_name,
        file_name: payload.file_name,
        file_path: payload.file_path,
        public_url: payload.public_url,
        file_extension: payload.file_extension,
        mime_type: payload.mime_typem,
        file_type: payload.file_type,
        file_category: payload.file_category,
        file_size: payload.file_size,
        visibility: payload.visibility,
        download_count: payload.download_count,
        public: payload.public,
      });

      return { result: await this.fileRepo.save(updatedParticipant) };
    } catch (error) {
      throw new HttpException(
        { message: 'Error updating file', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(payload: ParamIdDto): Promise<SingleResponse<FileEntity>> {
    const file: FileEntity = await this.fileRepo.findOne({
      where: { id: payload.id },
    });

    if (!file) {
      throw new NotFoundException('file not found');
    }

    return { result: file };
  }

  async delete(payload: ParamIdDto): Promise<{ result: true }> {
    const { id } = payload;
    await this.fileRepo.softDelete(id);
    return { result: true };
  }
}
