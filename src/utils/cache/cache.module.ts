import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { RedisCacheService } from '../../service/redis-cache.service';

@Global()
@Module({
  imports: [
    NestCacheModule.register({
      isGlobal: true,
      ttl: 600, // Increased to 10 minutes default TTL
      max: 50000, // Increased maximum number of items in cache
      // Enhanced cache configuration
      refreshThreshold: 300, // Refresh cache when TTL < 5 minutes
    }),
  ],
  providers: [RedisCacheService],
  exports: [RedisCacheService, NestCacheModule],
})
export class CacheModule {}
