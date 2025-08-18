export class BatchProcessor {
  /**
   * Process items in batches to avoid memory issues
   */
  static async processBatch<T, R>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => Promise<R[]>,
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Process items in parallel batches with concurrency limit
   */
  static async processParallelBatches<T, R>(
    items: T[],
    batchSize: number,
    concurrency: number,
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
      const promises = currentBatches.map(batch => processor(batch));
      const batchResults = await Promise.all(promises);
      
      // Flatten results
      for (const batchResult of batchResults) {
        results.push(...batchResult);
      }
    }
    
    return results;
  }

  /**
   * Chunk array into smaller arrays
   */
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
