import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return (await this.cache.get<T>(key)) ?? undefined;
    } catch (e) {
      this.logger.warn(`Cache get failed for key=${key}: ${e?.message || e}`);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cache.set(key, value as any, ttl);
    } catch (e) {
      this.logger.warn(`Cache set failed for key=${key}: ${e?.message || e}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cache.del(key);
    } catch (e) {
      this.logger.warn(`Cache del failed for key=${key}: ${e?.message || e}`);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.cache.clear();
    } catch (e) {
      this.logger.warn(`Cache clear failed: ${e?.message || e}`);
    }
  }

  async mget<T>(...keys: string[]): Promise<(T | undefined)[]> {
    const results = await Promise.all(keys.map((k) => this.get<T>(k)));
    return results;
  }

  async mset(pairs: Array<[string, any]>, ttl?: number): Promise<void> {
    await Promise.all(pairs.map(([k, v]) => this.set(k, v, ttl)));
    return;
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) return cached;
    const fresh = await factory();
    await this.set(key, fresh, ttl);
    return fresh;
  }
}
