# Prompt 3: Performance Optimization

## When to Use
**After core architecture is in place** - This prompt optimizes the application for production performance.

## Objective
Implement comprehensive performance optimizations including React optimizations, lazy loading, caching, and monitoring to ensure the application scales efficiently.

## Instructions

### Step 1: React Performance Optimizations
Implement React-specific performance improvements:

1. **React.memo() for Expensive Components**
   ```typescript
   import React, { memo } from 'react';
   
   interface ProjectImageProps {
     project: Project;
     onUpdate: (project: Project) => void;
   }
   
   export const ProjectImage = memo<ProjectImageProps>(({ project, onUpdate }) => {
     // Component implementation
   }, (prevProps, nextProps) => {
     // Custom comparison function
     return (
       prevProps.project.id === nextProps.project.id &&
       prevProps.project.updated_at === nextProps.project.updated_at
     );
   });
   ```

2. **useMemo() for Expensive Calculations**
   ```typescript
   export function useProjects() {
     const [projects, setProjects] = useState([]);
     
     const sortedProjects = useMemo(() => {
       return projects.sort((a, b) => a.sort_order - b.sort_order);
     }, [projects]);
     
     const publishedProjects = useMemo(() => {
       return sortedProjects.filter(project => project.published);
     }, [sortedProjects]);
     
     return { projects: sortedProjects, publishedProjects };
   }
   ```

3. **useCallback() for Event Handlers**
   ```typescript
   export function useProjects() {
     const updateProject = useCallback(async (id: string, updates: ProjectUpdate) => {
       // Implementation
     }, []);
     
     const deleteProject = useCallback(async (id: string) => {
       // Implementation
     }, []);
     
     return { updateProject, deleteProject };
   }
   ```

### Step 2: Lazy Loading Implementation
Implement code splitting and lazy loading:

1. **Route-based Code Splitting**
   ```typescript
   import { lazy, Suspense } from 'react';
   
   const Home = lazy(() => import('./pages/Home'));
   const About = lazy(() => import('./pages/About'));
   const Contact = lazy(() => import('./pages/Contact'));
   
   export function App() {
     return (
       <Suspense fallback={<div>Loading...</div>}>
         <Routes>
           <Route path="/" element={<Home />} />
           <Route path="/about" element={<About />} />
           <Route path="/contact" element={<Contact />} />
         </Routes>
       </Suspense>
     );
   }
   ```

2. **Component-based Lazy Loading**
   ```typescript
   const HeavyComponent = lazy(() => import('./components/HeavyComponent'));
   
   export function ParentComponent() {
     const [showHeavy, setShowHeavy] = useState(false);
     
     return (
       <div>
         <button onClick={() => setShowHeavy(true)}>
           Load Heavy Component
         </button>
         {showHeavy && (
           <Suspense fallback={<div>Loading...</div>}>
             <HeavyComponent />
           </Suspense>
         )}
       </div>
     );
   }
   ```

### Step 3: Image Optimization
Implement efficient image loading:

1. **LazyImage Component**
   ```typescript
   import { useState, useRef, useEffect } from 'react';
   
   interface LazyImageProps {
     src: string;
     alt: string;
     className?: string;
     onLoad?: () => void;
     onError?: () => void;
   }
   
   export const LazyImage = ({ src, alt, className, onLoad, onError }: LazyImageProps) => {
     const [isLoaded, setIsLoaded] = useState(false);
     const [isInView, setIsInView] = useState(false);
     const imgRef = useRef<HTMLImageElement>(null);
   
     useEffect(() => {
       const observer = new IntersectionObserver(
         ([entry]) => {
           if (entry.isIntersecting) {
             setIsInView(true);
             observer.disconnect();
           }
         },
         { threshold: 0.1 }
       );
   
       if (imgRef.current) {
         observer.observe(imgRef.current);
       }
   
       return () => observer.disconnect();
     }, []);
   
     return (
       <div ref={imgRef} className={className}>
         {isInView && (
           <img
             src={src}
             alt={alt}
             onLoad={() => {
               setIsLoaded(true);
               onLoad?.();
             }}
             onError={onError}
             style={{ opacity: isLoaded ? 1 : 0 }}
           />
         )}
       </div>
     );
   };
   ```

2. **Image Optimization Utilities**
   ```typescript
   export const optimizeImageUrl = (url: string, width?: number, height?: number) => {
     if (!url) return url;
     
     // Add image optimization parameters
     const params = new URLSearchParams();
     if (width) params.set('w', width.toString());
     if (height) params.set('h', height.toString());
     params.set('q', '80'); // Quality
     params.set('f', 'webp'); // Format
     
     return `${url}?${params.toString()}`;
   };
   ```

### Step 4: Skeleton Loading States
Implement skeleton loading for better UX:

1. **Skeleton Component**
   ```typescript
   interface SkeletonProps {
     count?: number;
     className?: string;
   }
   
   export const ProjectCardSkeleton = ({ count = 1, className }: SkeletonProps) => {
     return (
       <>
         {Array.from({ length: count }).map((_, index) => (
           <div key={index} className={`animate-pulse ${className}`}>
             <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
             <div className="space-y-2">
               <div className="h-4 bg-gray-200 rounded w-3/4"></div>
               <div className="h-4 bg-gray-200 rounded w-1/2"></div>
             </div>
           </div>
         ))}
       </>
     );
   };
   ```

2. **Loading State Integration**
   ```typescript
   export function ProjectList() {
     const { projects, loading } = useProjects();
     
     if (loading) {
       return <ProjectCardSkeleton count={6} />;
     }
     
     return (
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {projects.map(project => (
           <ProjectCard key={project.id} project={project} />
         ))}
       </div>
     );
   }
   ```

### Step 5: Virtual Scrolling
Implement virtual scrolling for large lists:

1. **VirtualizedList Component**
   ```typescript
   interface VirtualizedListProps {
     items: any[];
     itemHeight: number;
     containerHeight: number;
     renderItem: (item: any, index: number) => React.ReactNode;
   }
   
   export const VirtualizedList = ({ items, itemHeight, containerHeight, renderItem }: VirtualizedListProps) => {
     const [scrollTop, setScrollTop] = useState(0);
     
     const startIndex = Math.floor(scrollTop / itemHeight);
     const endIndex = Math.min(startIndex + Math.ceil(containerHeight / itemHeight), items.length);
     
     const visibleItems = items.slice(startIndex, endIndex);
     
     return (
       <div
         style={{ height: containerHeight, overflow: 'auto' }}
         onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
       >
         <div style={{ height: items.length * itemHeight, position: 'relative' }}>
           {visibleItems.map((item, index) => (
             <div
               key={startIndex + index}
               style={{
                 position: 'absolute',
                 top: (startIndex + index) * itemHeight,
                 height: itemHeight,
                 width: '100%'
               }}
             >
               {renderItem(item, startIndex + index)}
             </div>
           ))}
         </div>
       </div>
     );
   };
   ```

### Step 6: Cache Optimization
Implement intelligent caching strategies:

1. **Enhanced Cache Manager**
   ```typescript
   class CacheManager {
     private cache = new Map<string, CacheItem<any>>();
     private config = {
       defaultTTL: 5 * 60 * 1000, // 5 minutes
       maxAge: 24 * 60 * 60 * 1000, // 24 hours
     };
   
     async get<T>(key: string, fetcher: () => Promise<T>, options = {}): Promise<T> {
       const { ttl = this.config.defaultTTL, forceRefresh = false } = options;
       
       if (!forceRefresh) {
         const cached = this.cache.get(key);
         if (cached && this.isValid(cached)) {
           return cached.data;
         }
       }
   
       try {
         const data = await fetcher();
         this.set(key, data, ttl);
         return data;
       } catch (error) {
         // Fallback to cached data if available
         const cached = this.cache.get(key);
         if (cached) {
           return cached.data;
         }
         throw error;
       }
     }
   
     private isValid(item: CacheItem<any>): boolean {
       const age = Date.now() - item.timestamp;
       return age < item.ttl && age < this.config.maxAge;
     }
   }
   ```

### Step 7: Performance Monitoring
Implement performance monitoring:

1. **Performance Monitor Component**
   ```typescript
   interface PerformanceMetrics {
     renderTime: number;
     memoryUsage: number;
     componentName: string;
   }
   
   export const PerformanceMonitor = ({ componentName }: { componentName: string }) => {
     const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
   
     useEffect(() => {
       const startTime = performance.now();
       const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
   
       return () => {
         const endTime = performance.now();
         const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
   
         setMetrics({
           renderTime: endTime - startTime,
           memoryUsage: endMemory - startMemory,
           componentName
         });
       };
     }, [componentName]);
   
     if (process.env.NODE_ENV === 'development' && metrics) {
       console.log(`Performance metrics for ${componentName}:`, metrics);
     }
   
     return null;
   };
   ```

### Step 8: Bundle Analysis
Set up bundle analysis:

1. **Bundle Analyzer Script**
   ```javascript
   // scripts/analyze-bundle.js
   const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
   const path = require('path');
   
   module.exports = {
     plugins: [
       new BundleAnalyzerPlugin({
         analyzerMode: 'static',
         openAnalyzer: false,
         reportFilename: 'bundle-report.html'
       })
     ]
   };
   ```

2. **Package.json Script**
   ```json
   {
     "scripts": {
       "analyze": "node scripts/analyze-bundle.js"
     }
   }
   ```

### Step 9: Memory Optimization
Implement memory management:

1. **Memory Cleanup Utilities**
   ```typescript
   export const cleanupDuplicates = (items: any[], key: string) => {
     const seen = new Set();
     return items.filter(item => {
       const value = item[key];
       if (seen.has(value)) {
         return false;
       }
       seen.add(value);
       return true;
     });
   };
   
   export const clearCorruptedData = () => {
     try {
       const keys = Object.keys(localStorage);
       keys.forEach(key => {
         try {
           JSON.parse(localStorage.getItem(key) || '');
         } catch {
           localStorage.removeItem(key);
         }
       });
     } catch (error) {
       console.error('Error cleaning corrupted data:', error);
     }
   };
   ```

### Step 10: Animation Optimization
Optimize animations for performance:

1. **Optimized Animation Component**
   ```typescript
   import { motion, AnimatePresence } from 'motion/react';
   
   export const OptimizedAnimation = ({ children, isVisible }: { children: React.ReactNode; isVisible: boolean }) => {
     return (
       <AnimatePresence mode="wait">
         {isVisible && (
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -20 }}
             transition={{ duration: 0.3, ease: "easeOut" }}
             style={{ willChange: 'transform, opacity' }}
           >
             {children}
           </motion.div>
         )}
       </AnimatePresence>
     );
   };
   ```

## Expected Output
After running this prompt, you should have:

1. ✅ React components optimized with memo, useMemo, useCallback
2. ✅ Lazy loading implemented for routes and components
3. ✅ Image optimization with lazy loading
4. ✅ Skeleton loading states for better UX
5. ✅ Virtual scrolling for large lists
6. ✅ Intelligent caching system
7. ✅ Performance monitoring in development
8. ✅ Bundle analysis tools
9. ✅ Memory optimization utilities
10. ✅ Optimized animations

## Next Steps
After completing performance optimization:
- Run **Prompt 4: Production Readiness** to prepare for deployment
- Or run **Prompt 5a: AI Integration** if AI features are needed
- Or run **Prompt 5b: Audio Optimization** if audio features are needed

## Notes
- All optimizations are based on patterns from your working portfolio
- Performance monitoring is only active in development
- Caching strategies are designed to minimize API costs
- Virtual scrolling is only implemented when needed for large lists

