import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { EmailTemplateService } from '../../../../service/email-template.service';
import { EmailTemplateController } from './email-template.controller';
import { emailTemplateProviders } from '../../../../providers/email-template.providers';
import { DatabaseModule } from '../../../../database/database.module';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Module({
  imports: [
    DatabaseModule,
    MulterModule.register({
      storage: diskStorage({
        destination: './public/uploads/templates',
        filename: (req, file, cb) => {
          const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|svg)$/)) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed!'), false);
        }
      },
    }),
  ],
  controllers: [EmailTemplateController],
  providers: [EmailTemplateService, ...emailTemplateProviders],
  exports: [EmailTemplateService],
})
export class EmailTemplateModule {}
