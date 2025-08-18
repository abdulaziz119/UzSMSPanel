import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async clear(): Promise<void> {
    // cache-manager v7 da reset() o'rniga clear() ishlatiladi
    await this.cacheManager.clear();
  }

  // Keyv store orqali to'g'ridan-to'g'ri keys metodiga murojaat qilish
  async keys(pattern?: string): Promise<string[]> {
    try {
      // cache-manager v7 da store.keys() mavjud emas
      // Buning o'rniga manual implementatsiya kerak
      return [];
    } catch (error) {
      console.warn('Keys method not available in current store implementation');
      return [];
    }
  }

  // mget va mset metodlari ham cache-manager v7 da yo'q
  async mget<T>(...keys: string[]): Promise<(T | undefined)[]> {
    const results = await Promise.all(keys.map((key) => this.get<T>(key)));
    return results;
  }

  async mset(keyValuePairs: [string, any][], ttl?: number): Promise<void> {
    await Promise.all(
      keyValuePairs.map(([key, value]) => this.set(key, value, ttl)),
    );
  }

  // ttl metodi ham yo'q, o'rniga wrapper qilamiz
  async ttl(key: string): Promise<number> {
    // cache-manager v7 da TTL olish uchun alohida metod yo'q
    // -1 qaytaramiz (TTL noma'lum)
    return -1;
  }

  // Helper methods for common cache patterns
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const fresh = await factory();
    await this.set(key, fresh, ttl);
    return fresh;
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.keys(pattern);
    await Promise.all(keys.map((key) => this.del(key)));
  }

  // Cache tags for group invalidation
  async setWithTags<T>(
    key: string,
    value: T,
    tags: string[],
    ttl?: number,
  ): Promise<void> {
    await this.set(key, value, ttl);

    // Store tag associations
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const taggedKeys = (await this.get<string[]>(tagKey)) || [];
      if (!taggedKeys.includes(key)) {
        taggedKeys.push(key);
        await this.set(tagKey, taggedKeys, ttl);
      }
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    const tagKey = `tag:${tag}`;
    const taggedKeys = (await this.get<string[]>(tagKey)) || [];

    await Promise.all([
      ...taggedKeys.map((key) => this.del(key)),
      this.del(tagKey),
    ]);
  }
}
