// Performance monitoring utilities
export class PerformanceMonitor {
  private static timers = new Map<string, number>();

  static start(label: string) {
    this.timers.set(label, performance.now());
  }

  static end(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) return 0;
    
    const duration = performance.now() - startTime;
    this.timers.delete(label);
    
    if (duration > 1000) {
      console.warn(`🐌 Slow operation: ${label} took ${duration.toFixed(2)}ms`);
    } else if (duration > 100) {
      console.log(`⚡ ${label}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  static measure<T>(label: string, fn: () => T): T {
    this.start(label);
    const result = fn();
    this.end(label);
    return result;
  }

  static async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    const result = await fn();
    this.end(label);
    return result;
  }
}

// Debounce utility for expensive operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return function debounced(...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Throttle utility for frequent operations
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function throttled(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Image preloader for better perceived performance
export class ImagePreloader {
  private static cache = new Set<string>();

  static preload(urls: string[]): Promise<void[]> {
    return Promise.all(
      urls.map(url => {
        if (this.cache.has(url)) {
          return Promise.resolve();
        }

        return new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            this.cache.add(url);
            resolve();
          };
          img.onerror = reject;
          img.src = url;
        });
      })
    );
  }
}