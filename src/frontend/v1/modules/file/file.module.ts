import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from '../../../../service/file.service';
import { DatabaseModule } from '../../../../database/database.module';
import { fileProviders } from '../../../../providers/file.providers';
import { userProviders } from '../../../../providers/user.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [FileController],
  providers: [...fileProviders, ...userProviders, FileService],
})
export class FileModule {}
