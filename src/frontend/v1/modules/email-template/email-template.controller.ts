import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { EmailTemplateService } from '../../../../service/email-template.service';
import { CreateEmailTemplateDto, UpdateEmailTemplateDto, EmailTemplateQueryDto } from '../../../../utils/dto/email-template.dto';
import { JwtAuthGuard } from '../../../../dashboard/v1/modules/auth/jwt.strategy';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('email-template')
@UseGuards(JwtAuthGuard)
export class EmailTemplateController {
  constructor(private readonly emailTemplateService: EmailTemplateService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: any, @Body() createDto: CreateEmailTemplateDto) {
    const userId = req.user.id;
    return this.emailTemplateService.create(userId, createDto);
  }

  @Get()
  async findAll(@Req() req: any, @Query() query: EmailTemplateQueryDto) {
    const userId = req.user.id;
    return this.emailTemplateService.findAll(userId, query);
  }

  @Get('active')
  async getActiveTemplates(@Req() req: any) {
    const userId = req.user.id;
    return this.emailTemplateService.getActiveTemplates(userId);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    return this.emailTemplateService.findOne(userId, +id);
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() updateDto: UpdateEmailTemplateDto) {
    const userId = req.user.id;
    return this.emailTemplateService.update(userId, +id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    await this.emailTemplateService.remove(userId, +id);
  }

  @Post('upload-images')
  @UseInterceptors(FilesInterceptor('images', 10))
  async uploadImages(@Req() req: any, @UploadedFiles() files: Express.Multer.File[]) {
    const userId = req.user.id;
    return this.emailTemplateService.uploadTemplateImages(userId, files);
  }

    @Get('default')
  async getDefaultTemplates() {
    return {
      success: true,
      data: await this.emailTemplateService.getDefaultTemplates(),
    };
  }

  @Post('create-from-default/:templateKey')
  async createFromDefault(
    @Req() req: any,
    @Param('templateKey') templateKey: string,
  ) {
    const template = await this.emailTemplateService.createFromDefault(
      req.user.sub,
      templateKey,
    );

    return {
      success: true,
      message: 'Template created from default successfully',
      data: template,
    };
  }

  @Get(':id/preview')
  async previewTemplate(@Param('id') id: number) {
    const htmlContent = await this.emailTemplateService.previewTemplate(id);
    
    return {
      success: true,
      data: { html_content: htmlContent },
    };
  }

  @Post('builder/save')
  async saveBuilderTemplate(@Req() req: any, @Body() builderData: any) {
    const userId = req.user.id;
    return this.emailTemplateService.saveBuilderTemplate(userId, builderData);
  }

  @Get('builder/templates')
  async getBuilderTemplates(@Req() req: any) {
    const userId = req.user.id;
    return this.emailTemplateService.getBuilderTemplates(userId);
  }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './public/email-templates',
      filename: (req, file, cb) => {
        const randomName = Array(32)
          .fill(null)
          .map(() => Math.round(Math.random() * 16).toString(16))
          .join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  async uploadImage(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const imageUrl = `/email-templates/${file.filename}`;

    return {
      success: true,
      message: 'Image uploaded successfully',
      data: {
        filename: file.filename,
        url: imageUrl,
        size: file.size,
        mimetype: file.mimetype,
      },
    };
  }
}
