import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from '../../../../service/file.service';
import { DatabaseModule } from '../../../../database/database.module';
import { AxiosService } from '../../../../helpers/axios.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [DatabaseModule, HttpModule],
  controllers: [FileController],
  providers: [FileService, AxiosService],
})
export class FileModule {}
