import React, { useEffect, useState, memo } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  lastUpdate: Date;
}

interface PerformanceMonitorProps {
  componentName: string;
  enabled?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

const PerformanceMonitor = memo(({ 
  componentName, 
  enabled = process.env.NODE_ENV === 'development',
  onMetricsUpdate 
}: PerformanceMonitorProps) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0,
    lastUpdate: new Date()
  });

  useEffect(() => {
    if (!enabled) return;

    const startTime = performance.now();
    
    // Monitor memory usage (if available)
    const memoryInfo = (performance as any).memory;
    const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0;

    // Count React components in the DOM
    const componentCount = document.querySelectorAll('[data-react-component]').length;

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    const newMetrics: PerformanceMetrics = {
      renderTime,
      memoryUsage,
      componentCount,
      lastUpdate: new Date()
    };

    setMetrics(newMetrics);
    onMetricsUpdate?.(newMetrics);

    // Log performance warnings
    if (renderTime > 16) { // More than one frame at 60fps
      console.warn(`🐌 Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }

    if (memoryUsage > 100) { // More than 100MB
      console.warn(`🧠 High memory usage in ${componentName}: ${memoryUsage.toFixed(2)}MB`);
    }
  });

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded font-mono z-50">
      <div className="font-bold">{componentName}</div>
      <div>Render: {metrics.renderTime.toFixed(2)}ms</div>
      <div>Memory: {metrics.memoryUsage.toFixed(2)}MB</div>
      <div>Components: {metrics.componentCount}</div>
    </div>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';

export default PerformanceMonitor;
