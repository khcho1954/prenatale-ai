// Production Optimizations for Prena Tale
import compression from 'compression';
import { Express } from 'express';

// Database connection pool optimization
export const DATABASE_CONFIG = {
  max: 100, // Maximum connections
  min: 10,  // Minimum connections
  acquireTimeoutMillis: 30000,
  idleTimeoutMillis: 300000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 30000
};

// Cache configuration
export const CACHE_CONFIG = {
  DAILY_STORIES: 3600000,    // 1 hour
  USER_STATS: 1800000,       // 30 minutes
  READ_STORIES: 300000,      // 5 minutes
  LIBRARY_STORIES: 300000,   // 5 minutes
  STORY_CONTENT: 1800000,    // 30 minutes
  MAX_CACHE_SIZE: 1000       // Maximum cache entries
};

// Performance middleware
export function setupProductionOptimizations(app: Express) {
  // Gzip compression for all responses > 1KB
  app.use(compression({
    threshold: 1024,
    level: 6,
    memLevel: 8,
    chunkSize: 16384
  }));

  // Static file caching headers
  app.use('/assets', (req, res, next) => {
    res.set({
      'Cache-Control': 'public, max-age=31536000', // 1 year
      'ETag': false,
      'Last-Modified': false
    });
    next();
  });

  // API response caching headers
  app.use('/api', (req, res, next) => {
    if (req.method === 'GET') {
      res.set({
        'Cache-Control': 'public, max-age=300', // 5 minutes
        'Vary': 'Authorization, Accept-Language'
      });
    }
    next();
  });
}

// Database query optimization helpers
export const OPTIMIZED_QUERIES = {
  // Pre-built queries for frequent operations
  GET_USER_WITH_SUBSCRIPTION: `
    SELECT u.*, s.subscription_plan, s.end_date as subscription_end_date, s.status as subscription_status
    FROM users u
    LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
    WHERE u.id = $1
  `,
  
  GET_TODAY_STORIES_WITH_PROGRESS: `
    SELECT s.*, rp.is_read, rp.is_favorite
    FROM stories s
    LEFT JOIN reading_progress rp ON rp.story_id = s.id AND rp.user_id = $1
    WHERE s.status = 'active' AND s.is_created = false
    ORDER BY s.id
  `,
  
  GET_USER_READING_STATS: `
    SELECT 
      COUNT(DISTINCT rp.story_id) as stories_read,
      COUNT(DISTINCT CASE WHEN s.is_created = true THEN s.id END) as stories_created
    FROM reading_progress rp
    LEFT JOIN stories s ON s.id = rp.story_id
    WHERE rp.user_id = $1 AND rp.is_read = true
  `
};

// Memory optimization
export function setupMemoryOptimization() {
  // Garbage collection hints for Node.js
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      if (global.gc) {
        global.gc();
      }
    }, 300000); // Every 5 minutes
  }
}

// Performance monitoring
export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  activeConnections: number;
  cacheHitRate: number;
}

export class ProductionMonitor {
  private static metrics: PerformanceMetrics[] = [];
  
  static recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }
  
  static getAverageResponseTime(): number {
    if (this.metrics.length === 0) return 0;
    return this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / this.metrics.length;
  }
  
  static getMemoryStats() {
    return process.memoryUsage();
  }
}