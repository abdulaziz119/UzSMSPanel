import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PerformanceMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const method = req.method;
    const url = req.url;

    // Log request start (only for important endpoints)
    if (this.isImportantEndpoint(url)) {
      this.logger.log(`START ${method} ${url}`);
    }

    // Override res.end to capture response time
    const originalEnd = res.end;
    res.end = function (chunk?: any, encoding?: any) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const statusCode = res.statusCode;

      // Log slow requests or errors
      if (duration > 1000 || statusCode >= 400) {
        const level = statusCode >= 400 ? 'error' : 'warn';
        this.logger[level](`${method} ${url} - ${statusCode} - ${duration}ms`);
      }

      // Log performance metrics for important endpoints
      if (this.isImportantEndpoint(url)) {
        this.logger.log(`END ${method} ${url} - ${statusCode} - ${duration}ms`);
        
        // Track memory usage for heavy operations
        if (url.includes('/send-group') || url.includes('/send-contact')) {
          const memUsage = process.memoryUsage();
          this.logger.debug(`Memory: RSS ${Math.round(memUsage.rss / 1024 / 1024)}MB, Heap ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
        }
      }

      originalEnd.call(this, chunk, encoding);
    }.bind(this);

    next();
  }

  private isImportantEndpoint(url: string): boolean {
    const importantPaths = [
      '/send-contact',
      '/send-group',
      '/messages',
      '/auth',
    ];
    
    return importantPaths.some(path => url.includes(path));
  }
}
