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
    try {
      const cached = await this.get<T>(key);
      if (cached !== undefined) return cached;
      
      const fresh = await factory();
      // Use background set to avoid blocking
      this.set(key, fresh, ttl).catch(err => 
        this.logger.warn(`Background cache set failed for key=${key}: ${err?.message || err}`)
      );
      return fresh;
    } catch (error) {
      this.logger.error(`getOrSet failed for key=${key}: ${error?.message || error}`);
      // Return fresh data even if cache fails
      return await factory();
    }
  }

  async getBatch<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    try {
      const values = await this.mget<T>(...keys);
      keys.forEach((key, index) => {
        const value = values[index];
        if (value !== undefined) {
          results.set(key, value);
        }
      });
    } catch (e) {
      this.logger.warn(`Batch get failed: ${e?.message || e}`);
    }
    return results;
  }

  async setBatch(items: Array<[string, any]>, ttl?: number): Promise<void> {
    try {
      await this.mset(items, ttl);
    } catch (e) {
      this.logger.warn(`Batch set failed: ${e?.message || e}`);
    }
  }

  async getWithFallback<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) return cached;

    const fresh = await fallback();
    // Set cache in background
    this.set(key, fresh, ttl).catch(err =>
      this.logger.warn(`Fallback cache set failed for key=${key}: ${err?.message || err}`)
    );
    return fresh;
  }
}
