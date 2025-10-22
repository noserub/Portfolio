/**
 * Memory optimization utilities for the portfolio application
 */

// Memory monitoring and cleanup utilities
export class MemoryOptimizer {
  private static observers: Set<IntersectionObserver> = new Set();
  private static timers: Set<NodeJS.Timeout> = new Set();
  private static intervals: Set<NodeJS.Timeout> = new Set();

  /**
   * Register an observer for cleanup
   */
  static registerObserver(observer: IntersectionObserver): void {
    this.observers.add(observer);
  }

  /**
   * Register a timer for cleanup
   */
  static registerTimer(timer: NodeJS.Timeout): void {
    this.timers.add(timer);
  }

  /**
   * Register an interval for cleanup
   */
  static registerInterval(interval: NodeJS.Timeout): void {
    this.intervals.add(interval);
  }

  /**
   * Clean up all registered observers, timers, and intervals
   */
  static cleanup(): void {
    // Clean up observers
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();

    // Clean up timers
    this.timers.forEach(timer => {
      clearTimeout(timer);
    });
    this.timers.clear();

    // Clean up intervals
    this.intervals.forEach(interval => {
      clearInterval(interval);
    });
    this.intervals.clear();
  }

  /**
   * Get current memory usage (if available)
   */
  static getMemoryUsage(): number {
    try {
      const memoryInfo = (performance as any).memory;
      return memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Check if memory usage is high
   */
  static isHighMemoryUsage(threshold: number = 100): boolean {
    return this.getMemoryUsage() > threshold;
  }

  /**
   * Force garbage collection (if available)
   */
  static forceGC(): void {
    try {
      if (typeof window !== 'undefined' && (window as any).gc) {
        (window as any).gc();
      }
    } catch {
      // GC not available
    }
  }
}

/**
 * Debounce function to prevent excessive function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function to limit function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Safe console logging that can be disabled in production
 */
export const safeConsole = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    console.error(...args);
  }
};

/**
 * Memory-efficient image preloader
 */
export class ImagePreloader {
  private static cache: Map<string, HTMLImageElement> = new Map();
  private static maxCacheSize: number = 50;

  static preload(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      // Check cache first
      if (this.cache.has(src)) {
        resolve(this.cache.get(src)!);
        return;
      }

      // Clean cache if it's too large
      if (this.cache.size >= this.maxCacheSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }

      const img = new Image();
      img.onload = () => {
        this.cache.set(src, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  static clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Memory-efficient data structure for large lists
 */
export class MemoryEfficientList<T> {
  private items: T[] = [];
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  add(item: T): void {
    this.items.push(item);
    
    // Remove oldest items if we exceed max size
    if (this.items.length > this.maxSize) {
      this.items = this.items.slice(-this.maxSize);
    }
  }

  getItems(): T[] {
    return [...this.items];
  }

  clear(): void {
    this.items = [];
  }

  get length(): number {
    return this.items.length;
  }
}
