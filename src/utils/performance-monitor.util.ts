import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PerformanceMonitor {
  private readonly logger = new Logger(PerformanceMonitor.name);
  private readonly metrics = new Map<string, any>();

  startTimer(operation: string): () => number {
    const startTime = process.hrtime.bigint();
    return () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      this.recordMetric(operation, duration);
      return duration;
    };
  }

  recordMetric(operation: string, value: number): void {
    const existing = this.metrics.get(operation) || { count: 0, total: 0, min: Infinity, max: 0 };
    
    existing.count++;
    existing.total += value;
    existing.min = Math.min(existing.min, value);
    existing.max = Math.max(existing.max, value);
    existing.avg = existing.total / existing.count;
    
    this.metrics.set(operation, existing);
    
    // Log slow operations
    if (value > 1000) { // > 1 second
      this.logger.warn(`Slow operation detected: ${operation} took ${value.toFixed(2)}ms`);
    }
  }

  getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    this.metrics.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  resetMetrics(): void {
    this.metrics.clear();
  }

  async measureAsync<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const timer = this.startTimer(operation);
    try {
      const result = await fn();
      timer();
      return result;
    } catch (error) {
      timer();
      throw error;
    }
  }

  measure<T>(operation: string, fn: () => T): T {
    const timer = this.startTimer(operation);
    try {
      const result = fn();
      timer();
      return result;
    } catch (error) {
      timer();
      throw error;
    }
  }

  logMemoryUsage(): void {
    const usage = process.memoryUsage();
    this.logger.log(`Memory Usage: RSS: ${Math.round(usage.rss / 1024 / 1024)}MB, Heap: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
  }

  startMemoryMonitoring(intervalMs: number = 60000): void {
    setInterval(() => {
      this.logMemoryUsage();
    }, intervalMs);
  }
}
