import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { RedisCacheService } from '../../service/redis-cache.service';

@Global()
@Module({
  imports: [
    NestCacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes default TTL
    }),
  ],
  providers: [RedisCacheService],
  exports: [RedisCacheService, NestCacheModule],
})
export class CacheModule {}
