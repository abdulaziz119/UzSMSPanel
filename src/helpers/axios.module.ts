import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from '../database/database.module';
import { AxiosService } from './axios.service';

const services = [AxiosService];

@Module({
  imports: [HttpModule, DatabaseModule],
  exports: services,
  providers: services,
})
export class AxiosModule {}
