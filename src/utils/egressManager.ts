/**
 * Egress Manager - Handles Supabase egress limits and fallback strategies
 * Automatically detects when egress limits are hit and switches to local storage
 */

interface EgressStatus {
  isLimited: boolean;
  lastCheck: number;
  errorCount: number;
  fallbackMode: boolean;
}

class EgressManager {
  private status: EgressStatus = {
    isLimited: false,
    lastCheck: 0,
    errorCount: 0,
    fallbackMode: false
  };

  private readonly MAX_ERRORS = 3;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if we're hitting egress limits
   */
  async checkEgressStatus(): Promise<boolean> {
    const now = Date.now();
    
    // Don't check too frequently
    if (now - this.status.lastCheck < this.CHECK_INTERVAL) {
      return this.status.isLimited;
    }

    try {
      // Try a simple Supabase query to test connectivity
      const { supabase } = await import('../lib/supabaseClient');
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) {
        // Check if it's an egress/rate limit error
        if (this.isEgressError(error)) {
          this.status.isLimited = true;
          this.status.fallbackMode = true;
          console.warn('🚫 Egress limit detected, switching to fallback mode');
          return true;
        }
      } else {
        // Success - reset error count
        this.status.errorCount = 0;
        this.status.isLimited = false;
        this.status.fallbackMode = false;
      }
    } catch (error) {
      this.status.errorCount++;
      if (this.status.errorCount >= this.MAX_ERRORS) {
        this.status.isLimited = true;
        this.status.fallbackMode = true;
        console.warn('🚫 Multiple errors detected, switching to fallback mode');
      }
    }

    this.status.lastCheck = now;
    return this.status.isLimited;
  }

  /**
   * Check if error is related to egress limits
   */
  private isEgressError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    const code = error?.code || '';
    
    return (
      message.includes('egress') ||
      message.includes('quota') ||
      message.includes('limit') ||
      message.includes('rate limit') ||
      code === 'PGRST301' || // Rate limit
      code === 'PGRST302' || // Quota exceeded
      message.includes('too many requests')
    );
  }

  /**
   * Get current egress status
   */
  getStatus(): EgressStatus {
    return { ...this.status };
  }

  /**
   * Force fallback mode (for testing or manual override)
   */
  enableFallbackMode(): void {
    this.status.fallbackMode = true;
    this.status.isLimited = true;
    console.log('🔄 Fallback mode enabled manually');
  }

  /**
   * Disable fallback mode
   */
  disableFallbackMode(): void {
    this.status.fallbackMode = false;
    this.status.isLimited = false;
    this.status.errorCount = 0;
    console.log('✅ Fallback mode disabled');
  }

  /**
   * Check if we should use fallback storage
   */
  shouldUseFallback(): boolean {
    return this.status.fallbackMode || this.status.isLimited;
  }

  /**
   * Get fallback data with intelligent caching
   */
  async getFallbackData<T>(key: string, defaultValue: T): Promise<T> {
    try {
      // Try localStorage first
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log(`📦 Using fallback data for ${key}`);
        return parsed;
      }
    } catch (error) {
      console.warn(`Failed to parse fallback data for ${key}:`, error);
    }

    // Return default value
    console.log(`📝 Using default data for ${key}`);
    return defaultValue;
  }

  /**
   * Save data with fallback strategy
   */
  async saveWithFallback<T>(key: string, data: T, supabaseSave: () => Promise<void>): Promise<boolean> {
    // Always save to localStorage as backup
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`💾 Saved to localStorage: ${key}`);
    } catch (error) {
      console.warn(`Failed to save to localStorage: ${key}`, error);
    }

    // Try Supabase if not in fallback mode
    if (!this.shouldUseFallback()) {
      try {
        await supabaseSave();
        console.log(`✅ Saved to Supabase: ${key}`);
        return true;
      } catch (error) {
        console.warn(`Failed to save to Supabase: ${key}`, error);
        this.status.errorCount++;
        return false;
      }
    } else {
      console.log(`🔄 Skipping Supabase save (fallback mode): ${key}`);
      return false;
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    const stats = {
      fallbackMode: this.status.fallbackMode,
      errorCount: this.status.errorCount,
      lastCheck: new Date(this.status.lastCheck).toISOString(),
      localStorageKeys: Object.keys(localStorage).filter(key => 
        !key.startsWith('cache_') && 
        !key.startsWith('supabase.')
      ).length
    };

    return stats;
  }
}

// Global egress manager instance
export const egressManager = new EgressManager();

// Auto-check egress status on app load
if (typeof window !== 'undefined') {
  egressManager.checkEgressStatus();
}

export default egressManager;
