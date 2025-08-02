import { performanceCache } from './cache';

// Performance monitoring and health checks
export class PerformanceMonitor {
  private requestCount = 0;
  private errorCount = 0;
  private responseTimeSum = 0;
  private responseTimeCount = 0;
  private startTime = Date.now();
  private readonly maxRequestsPerMinute = 6000; // 100 requests per second
  private readonly maxResponseTime = 5000; // 5 seconds

  // Request tracking
  recordRequest(responseTime: number): void {
    this.requestCount++;
    this.responseTimeSum += responseTime;
    this.responseTimeCount++;
    
    // Alert if response time is too high
    if (responseTime > this.maxResponseTime) {
      console.warn(`High response time detected: ${responseTime}ms`);
    }
  }

  recordError(): void {
    this.errorCount++;
  }

  // Health check endpoint data
  getHealthStats(): any {
    const uptime = Date.now() - this.startTime;
    const avgResponseTime = this.responseTimeCount > 0 ? this.responseTimeSum / this.responseTimeCount : 0;
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;
    
    return {
      uptime,
      totalRequests: this.requestCount,
      errorCount: this.errorCount,
      errorRate: `${errorRate.toFixed(2)}%`,
      avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
      cacheStats: performanceCache.getCacheStats(),
      healthy: errorRate < 5 && avgResponseTime < 1000, // Less than 5% error rate and 1s avg response
      timestamp: new Date().toISOString()
    };
  }

  // Rate limiting check
  checkRateLimit(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Simple rate limiting - could be enhanced with Redis for distributed systems
    if (this.requestCount > this.maxRequestsPerMinute) {
      console.warn('Rate limit exceeded');
      return false;
    }
    
    return true;
  }

  // Reset counters (called periodically)
  resetCounters(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimeSum = 0;
    this.responseTimeCount = 0;
  }

  // Memory usage monitoring
  getMemoryUsage(): any {
    const used = process.memoryUsage();
    return {
      rss: `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,
      external: `${Math.round(used.external / 1024 / 1024 * 100) / 100} MB`,
    };
  }

  // Database connection monitoring
  async checkDatabaseHealth(): Promise<boolean> {
    try {
      const { db } = await import('./db');
      // Simple query to check database connectivity
      await db.execute('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Reset counters every hour to prevent overflow
setInterval(() => {
  performanceMonitor.resetCounters();
}, 60 * 60 * 1000);