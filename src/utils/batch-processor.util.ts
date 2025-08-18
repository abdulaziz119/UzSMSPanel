export class BatchProcessor {
  static async processBatch<T, R>(
    items: T[],
    batchSize: number = 500, // Increased default batch size
    processor: (batch: T[]) => Promise<R[]>,
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      try {
        const batchResults = await processor(batch);
        results.push(...batchResults);
      } catch (error) {
        console.error(`Batch processing failed at index ${i}:`, error);
        // Continue with next batch instead of failing completely
        continue;
      }
    }

    return results;
  }

  static async processParallelBatches<T, R>(
    items: T[],
    batchSize: number = 500, // Increased batch size
    concurrency: number = 10, // Increased concurrency
    processor: (batch: T[]) => Promise<R[]>,
  ): Promise<R[]> {
    const batches: T[][] = [];

    // Create batches
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    const results: R[] = [];

    // Process batches with concurrency limit
    for (let i = 0; i < batches.length; i += concurrency) {
      const currentBatches = batches.slice(i, i + concurrency);
      try {
        const promises = currentBatches.map((batch) => processor(batch));
        const batchResults = await Promise.allSettled(promises);

        // Handle results and errors
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            results.push(...result.value);
          } else {
            console.error('Batch failed:', result.reason);
          }
        }
      } catch (error) {
        console.error(`Parallel batch processing failed:`, error);
      }
    }

    return results;
  }

  static chunk<T>(array: T[], size: number = 500): T[][] {
    if (size <= 0) throw new Error('Chunk size must be positive');

    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  static async processWithRateLimit<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    rateLimit: number = 100, // items per second
    batchSize: number = 50,
  ): Promise<R[]> {
    const results: R[] = [];
    const delay = 1000 / rateLimit; // delay between items in ms

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(async (item, index) => {
        if (index > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay * index));
        }
        return processor(item);
      });

      const batchResults = await Promise.allSettled(batchPromises);

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      }
    }

    return results;
  }
}
