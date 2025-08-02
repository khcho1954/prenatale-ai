import { Request, Response, NextFunction } from 'express';
import { performanceMonitor } from '../performance-monitor';

// Performance monitoring middleware
export function performanceMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Check rate limiting
  if (!performanceMonitor.checkRateLimit()) {
    return res.status(429).json({ 
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.'
    });
  }
  
  // Override res.json to capture response time
  const originalJson = res.json;
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime);
    
    // Add performance headers
    res.set({
      'X-Response-Time': `${responseTime}ms`,
      'X-Request-ID': req.headers['x-request-id'] || 'unknown'
    });
    
    return originalJson.call(this, data);
  };
  
  // Error handling
  res.on('error', () => {
    performanceMonitor.recordError();
  });
  
  next();
}

// Error handling middleware
export function errorHandlingMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  performanceMonitor.recordError();
  
  console.error('Request error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // Don't expose internal errors in production
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: isDev ? err.message : 'Something went wrong',
    ...(isDev && { stack: err.stack })
  });
}

// Graceful shutdown handler
export function setupGracefulShutdown() {
  const shutdown = (signal: string) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    
    // Close database connections
    process.exit(0);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}