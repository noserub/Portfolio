/**
 * Cache Manager for reducing Supabase API calls and egress usage
 * Implements intelligent caching with TTL and fallback strategies
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  source: 'supabase' | 'localStorage' | 'fallback';
}

interface CacheConfig {
  defaultTTL: number;
  maxAge: number;
  enableLocalStorage: boolean;
  enableSupabase: boolean;
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      enableLocalStorage: true,
      enableSupabase: true,
      ...config
    };
  }

  /**
   * Get data from cache with fallback strategy
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: { ttl?: number; forceRefresh?: boolean } = {}
  ): Promise<T> {
    const { ttl = this.config.defaultTTL, forceRefresh = false } = options;
    
    // Check memory cache first
    if (!forceRefresh) {
      const cached = this.cache.get(key);
      if (cached && this.isValid(cached)) {
        console.log(`📦 Cache hit (memory): ${key}`);
        return cached.data;
      }
    }

    // Check localStorage cache
    if (this.config.enableLocalStorage && !forceRefresh) {
      const localCached = this.getFromLocalStorage<T>(key);
      if (localCached && this.isValid(localCached)) {
        console.log(`📦 Cache hit (localStorage): ${key}`);
        this.cache.set(key, localCached);
        return localCached.data;
      }
    }

    // Fetch from source with error handling
    try {
      if (this.config.enableSupabase) {
        console.log(`🌐 Fetching from Supabase: ${key}`);
        const data = await fetcher();
        this.set(key, data, ttl, 'supabase');
        return data;
      } else {
        throw new Error('Supabase disabled due to egress limits');
      }
    } catch (error) {
      console.warn(`❌ Supabase fetch failed for ${key}:`, error);
      
      // Try localStorage fallback
      const localCached = this.getFromLocalStorage<T>(key);
      if (localCached) {
        console.log(`🔄 Using localStorage fallback: ${key}`);
        return localCached.data;
      }
      
      // Return default/empty data
      console.log(`⚠️ No fallback available for ${key}, returning empty data`);
      return {} as T;
    }
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttl: number = this.config.defaultTTL, source: 'supabase' | 'localStorage' | 'fallback' = 'supabase'): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      source
    };

    // Store in memory cache
    this.cache.set(key, item);

    // Store in localStorage for persistence
    if (this.config.enableLocalStorage) {
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify(item));
      } catch (error) {
        console.warn('Failed to store in localStorage:', error);
      }
    }
  }

  /**
   * Get data from localStorage
   */
  private getFromLocalStorage<T>(key: string): CacheItem<T> | null {
    try {
      const stored = localStorage.getItem(`cache_${key}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to parse localStorage cache:', error);
    }
    return null;
  }

  /**
   * Check if cache item is still valid
   */
  private isValid(item: CacheItem<any>): boolean {
    const age = Date.now() - item.timestamp;
    return age < item.ttl && age < this.config.maxAge;
  }

  /**
   * Clear expired cache entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (!this.isValid(item)) {
        this.cache.delete(key);
        localStorage.removeItem(`cache_${key}`);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    // Clear localStorage cache entries
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;
    let sources = { supabase: 0, localStorage: 0, fallback: 0 };

    for (const item of this.cache.values()) {
      if (this.isValid(item)) {
        valid++;
      } else {
        expired++;
      }
      sources[item.source]++;
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      sources,
      memoryUsage: JSON.stringify(Array.from(this.cache.entries())).length
    };
  }

  /**
   * Disable Supabase to prevent egress usage
   */
  disableSupabase(): void {
    this.config.enableSupabase = false;
    console.log('🚫 Supabase disabled due to egress limits');
  }

  /**
   * Enable Supabase
   */
  enableSupabase(): void {
    this.config.enableSupabase = true;
    console.log('✅ Supabase enabled');
  }
}

// Global cache instance
export const cacheManager = new CacheManager();

// Auto-cleanup expired entries every 10 minutes
setInterval(() => {
  cacheManager.clearExpired();
}, 10 * 60 * 1000);

export default cacheManager;
