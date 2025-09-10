import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { IMAGES_URL, IMAGES_PROJECT_NAME } from '../utils/env/env';
import { AxiosService } from '../helpers/axios.service';

@Injectable()
export class FileService {
  private url: string = IMAGES_URL;

  constructor(private readonly axiosService: AxiosService) {}

  async create(
    file: Express.Multer.File,
  ): Promise<{ success: boolean; message: string; data: {} }> {
    try {
      const FormData = require('form-data');
      const formData = new FormData();

      formData.append('files', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      formData.append('source', IMAGES_PROJECT_NAME);

      const url: string = `${this.url}/file/upload`;

      const config = {
        headers: {
          ...formData.getHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      };

      const response: any = await this.axiosService.sendPostFileRequest(
        url,
        formData,
        config,
      );

      const fileDetails = response.data?.file_details?.[0];

      return {
        success: true,
        message: 'File uploaded successfully.',
        data: {
          id: fileDetails?.id || null,
          public_url: fileDetails?.url || null,
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
