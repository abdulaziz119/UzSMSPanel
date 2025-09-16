import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';
import { smppProvider } from '../providers/smpp.provider';

@Module({
  providers: [...databaseProviders, smppProvider],
  exports: [...databaseProviders, smppProvider],
})
export class DatabaseModule {}
