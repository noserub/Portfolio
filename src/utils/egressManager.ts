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
   * Check if we're hitting egress limits with enhanced detection
   */
  async checkEgressStatus(): Promise<boolean> {
    const now = Date.now();
    
    // Don't check too frequently
    if (now - this.status.lastCheck < this.CHECK_INTERVAL) {
      return this.status.isLimited;
    }

    try {
      const { supabase } = await import('../lib/supabaseClient');
      
      // Test multiple endpoints to get a better picture
      const tests = await Promise.allSettled([
        // Test 1: Simple profile query
        supabase.from('profiles').select('id').limit(1),
        // Test 2: App settings query
        supabase.from('app_settings').select('id').limit(1),
        // Test 3: Projects query
        supabase.from('projects').select('id').limit(1)
      ]);

      let errorCount = 0;
      let egressErrors = 0;
      let rateLimitErrors = 0;
      let quotaErrors = 0;

      // Analyze all test results
      for (const test of tests) {
        if (test.status === 'rejected') {
          errorCount++;
          const error = test.reason;
          if (this.isEgressError(error)) egressErrors++;
          if (this.isRateLimitError(error)) rateLimitErrors++;
          if (this.isQuotaError(error)) quotaErrors++;
        } else if (test.status === 'fulfilled' && test.value.error) {
          errorCount++;
          const error = test.value.error;
          if (this.isEgressError(error)) egressErrors++;
          if (this.isRateLimitError(error)) rateLimitErrors++;
          if (this.isQuotaError(error)) quotaErrors++;
        }
      }

      // Determine if we should enable fallback mode
      const shouldEnableFallback = 
        egressErrors > 0 || 
        rateLimitErrors > 0 || 
        quotaErrors > 0 || 
        errorCount >= 2; // If 2+ tests fail

      if (shouldEnableFallback) {
        this.status.isLimited = true;
        this.status.fallbackMode = true;
        this.status.errorCount = errorCount;
        
        console.warn('🚫 Supabase limits detected:', {
          egressErrors,
          rateLimitErrors,
          quotaErrors,
          totalErrors: errorCount,
          fallbackMode: 'ENABLED'
        });
        return true;
      } else {
        // Success - reset error count
        this.status.errorCount = 0;
        this.status.isLimited = false;
        this.status.fallbackMode = false;
        console.log('✅ Supabase connectivity confirmed');
      }
    } catch (error) {
      this.status.errorCount++;
      console.error('❌ Egress check failed:', error);
      
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
      message.includes('too many requests') ||
      message.includes('bandwidth') ||
      message.includes('data transfer') ||
      message.includes('usage limit')
    );
  }

  /**
   * Check if error is related to rate limiting
   */
  private isRateLimitError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    const code = error?.code || '';
    
    return (
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('throttle') ||
      message.includes('429') ||
      code === 'PGRST301' ||
      code === '429' ||
      message.includes('request limit')
    );
  }

  /**
   * Check if error is related to quota limits
   */
  private isQuotaError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    const code = error?.code || '';
    
    return (
      message.includes('quota') ||
      message.includes('exceeded') ||
      message.includes('limit reached') ||
      message.includes('usage limit') ||
      code === 'PGRST302' ||
      message.includes('plan limit') ||
      message.includes('subscription limit')
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

  /**
   * Force immediate egress check (bypasses interval)
   */
  async forceCheck(): Promise<boolean> {
    console.log('🔍 Forcing immediate egress check...');
    this.status.lastCheck = 0; // Reset last check to force immediate check
    return await this.checkEgressStatus();
  }

  /**
   * Get detailed error analysis
   */
  async analyzeErrors(): Promise<{
    hasErrors: boolean;
    errorTypes: string[];
    recommendations: string[];
  }> {
    try {
      const { supabase } = await import('../lib/supabaseClient');
      
      const tests = await Promise.allSettled([
        supabase.from('profiles').select('id').limit(1),
        supabase.from('app_settings').select('id').limit(1),
        supabase.from('projects').select('id').limit(1)
      ]);

      const errorTypes: string[] = [];
      let hasErrors = false;

      for (const test of tests) {
        if (test.status === 'rejected') {
          hasErrors = true;
          const error = test.reason;
          if (this.isEgressError(error)) errorTypes.push('Egress Limit');
          if (this.isRateLimitError(error)) errorTypes.push('Rate Limit');
          if (this.isQuotaError(error)) errorTypes.push('Quota Exceeded');
        } else if (test.status === 'fulfilled' && test.value.error) {
          hasErrors = true;
          const error = test.value.error;
          if (this.isEgressError(error)) errorTypes.push('Egress Limit');
          if (this.isRateLimitError(error)) errorTypes.push('Rate Limit');
          if (this.isQuotaError(error)) errorTypes.push('Quota Exceeded');
        }
      }

      const recommendations: string[] = [];
      if (errorTypes.includes('Egress Limit')) {
        recommendations.push('Enable fallback mode to reduce egress usage');
      }
      if (errorTypes.includes('Rate Limit')) {
        recommendations.push('Implement request throttling and caching');
      }
      if (errorTypes.includes('Quota Exceeded')) {
        recommendations.push('Consider upgrading Supabase plan or optimizing data usage');
      }

      return { hasErrors, errorTypes, recommendations };
    } catch (error) {
      return {
        hasErrors: true,
        errorTypes: ['Connection Error'],
        recommendations: ['Check network connectivity and Supabase status']
      };
    }
  }
}

// Global egress manager instance
export const egressManager = new EgressManager();

// Auto-check egress status on app load
if (typeof window !== 'undefined') {
  egressManager.checkEgressStatus();
}

export default egressManager;
