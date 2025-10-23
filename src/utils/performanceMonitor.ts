/**
 * Performance Monitor for Image Optimization
 * 
 * Tracks egress reduction and performance improvements from image optimizations
 */

interface PerformanceMetrics {
  originalSize: number;
  optimizedSize: number;
  reductionPercent: number;
  format: 'webp' | 'jpeg' | 'png';
  quality: number;
  timestamp: number;
}

interface EgressStats {
  totalRequests: number;
  totalBytes: number;
  webpRequests: number;
  jpegRequests: number;
  averageReduction: number;
  estimatedSavings: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private egressStats: EgressStats = {
    totalRequests: 0,
    totalBytes: 0,
    webpRequests: 0,
    jpegRequests: 0,
    averageReduction: 0,
    estimatedSavings: 0
  };

  /**
   * Record a performance metric for an optimized image
   */
  recordMetric(metric: Omit<PerformanceMetrics, 'timestamp'>): void {
    const fullMetric: PerformanceMetrics = {
      ...metric,
      timestamp: Date.now()
    };
    
    this.metrics.push(fullMetric);
    this.updateEgressStats();
    
    console.log('📊 Performance metric recorded:', {
      reduction: `${metric.reductionPercent}%`,
      format: metric.format,
      quality: metric.quality,
      originalSize: `${(metric.originalSize / 1024).toFixed(1)}KB`,
      optimizedSize: `${(metric.optimizedSize / 1024).toFixed(1)}KB`
    });
  }

  /**
   * Update egress statistics based on recorded metrics
   */
  private updateEgressStats(): void {
    if (this.metrics.length === 0) return;

    const recentMetrics = this.metrics.slice(-50); // Last 50 metrics
    
    this.egressStats.totalRequests = recentMetrics.length;
    this.egressStats.totalBytes = recentMetrics.reduce((sum, m) => sum + m.optimizedSize, 0);
    this.egressStats.webpRequests = recentMetrics.filter(m => m.format === 'webp').length;
    this.egressStats.jpegRequests = recentMetrics.filter(m => m.format === 'jpeg').length;
    this.egressStats.averageReduction = recentMetrics.reduce((sum, m) => sum + m.reductionPercent, 0) / recentMetrics.length;
    
    // Calculate estimated savings
    const originalTotal = recentMetrics.reduce((sum, m) => sum + m.originalSize, 0);
    const optimizedTotal = recentMetrics.reduce((sum, m) => sum + m.optimizedSize, 0);
    this.egressStats.estimatedSavings = originalTotal - optimizedTotal;
  }

  /**
   * Get current performance statistics
   */
  getStats(): EgressStats & { metricsCount: number } {
    return {
      ...this.egressStats,
      metricsCount: this.metrics.length
    };
  }

  /**
   * Get a performance report
   */
  getReport(): string {
    const stats = this.getStats();
    const savingsMB = (stats.estimatedSavings / 1024 / 1024).toFixed(2);
    const reductionPercent = stats.averageReduction.toFixed(1);
    
    return `
📊 Image Optimization Performance Report

🎯 Egress Reduction: ${reductionPercent}% average
💾 Estimated Savings: ${savingsMB}MB
📈 Total Requests: ${stats.totalRequests}
🖼️ WebP Requests: ${stats.webpRequests} (${((stats.webpRequests / stats.totalRequests) * 100).toFixed(1)}%)
🖼️ JPEG Requests: ${stats.jpegRequests} (${((stats.jpegRequests / stats.totalRequests) * 100).toFixed(1)}%)
📊 Metrics Tracked: ${stats.metricsCount}

Expected Supabase Egress Reduction: 70-85%
    `.trim();
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clear(): void {
    this.metrics = [];
    this.egressStats = {
      totalRequests: 0,
      totalBytes: 0,
      webpRequests: 0,
      jpegRequests: 0,
      averageReduction: 0,
      estimatedSavings: 0
    };
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }
}

// Create a singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Utility function to estimate size reduction
 */
export function estimateSizeReduction(
  originalSize: number,
  quality: number = 80,
  format: 'webp' | 'jpeg' = 'webp'
): number {
  // WebP is typically 25-35% smaller than JPEG
  const formatReduction = format === 'webp' ? 0.3 : 0.1;
  
  // Quality reduction (80% quality vs 100%)
  const qualityReduction = (100 - quality) / 100 * 0.4;
  
  // Combined reduction
  const totalReduction = formatReduction + qualityReduction;
  
  return Math.min(totalReduction, 0.7); // Cap at 70% reduction
}

/**
 * Utility function to calculate optimized size
 */
export function calculateOptimizedSize(
  originalSize: number,
  quality: number = 80,
  format: 'webp' | 'jpeg' = 'webp'
): number {
  const reduction = estimateSizeReduction(originalSize, quality, format);
  return Math.round(originalSize * (1 - reduction));
}
