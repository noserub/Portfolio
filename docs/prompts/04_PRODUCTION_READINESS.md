# Prompt 4: Production Readiness

## When to Use
**Before deployment** - This prompt prepares the application for production deployment with proper error handling, SEO, analytics, and security.

## Objective
Implement production-ready features including error handling, SEO optimization, analytics integration, environment management, and security best practices.

## Instructions

### Step 1: Error Handling & Logging
Implement comprehensive error handling:

1. **Global Error Handler**
   ```typescript
   // src/utils/errorHandler.ts
   export class ErrorHandler {
     static logError(error: Error, context?: string) {
       const errorInfo = {
         message: error.message,
         stack: error.stack,
         context,
         timestamp: new Date().toISOString(),
         userAgent: navigator.userAgent,
         url: window.location.href
       };
   
       // Log to console in development
       if (process.env.NODE_ENV === 'development') {
         console.error('Error:', errorInfo);
       }
   
       // Send to error tracking service in production
       if (process.env.NODE_ENV === 'production') {
         this.sendToErrorService(errorInfo);
       }
     }
   
     private static sendToErrorService(errorInfo: any) {
       // Implement error tracking service integration
       // e.g., Sentry, LogRocket, or custom endpoint
     }
   }
   ```

2. **Error Boundary with Recovery**
   ```typescript
   import React from 'react';
   import { ErrorHandler } from '../utils/errorHandler';
   
   interface ErrorBoundaryState {
     hasError: boolean;
     error: Error | null;
     errorId: string;
   }
   
   class ErrorBoundary extends React.Component<{}, ErrorBoundaryState> {
     constructor(props: {}) {
       super(props);
       this.state = { hasError: false, error: null, errorId: '' };
     }
   
     static getDerivedStateFromError(error: Error): ErrorBoundaryState {
       return { 
         hasError: true, 
         error, 
         errorId: Math.random().toString(36).substr(2, 9) 
       };
     }
   
     componentDidCatch(error: Error, errorInfo: any) {
       ErrorHandler.logError(error, 'ErrorBoundary');
     }
   
     render() {
       if (this.state.hasError) {
         return (
           <div className="error-fallback">
             <h2>Something went wrong</h2>
             <p>Error ID: {this.state.errorId}</p>
             <button onClick={() => window.location.reload()}>
               Reload Page
             </button>
           </div>
         );
       }
   
       return this.props.children;
     }
   }
   ```

### Step 2: SEO Optimization
Implement comprehensive SEO:

1. **SEO Hook**
   ```typescript
   // src/hooks/useSEO.ts
   import { useEffect } from 'react';
   
   interface SEOData {
     title: string;
     description: string;
     keywords?: string;
     image?: string;
     url?: string;
     type?: string;
   }
   
   export function useSEO(seoData: SEOData) {
     useEffect(() => {
       // Update document title
       document.title = seoData.title;
   
       // Update meta description
       const metaDescription = document.querySelector('meta[name="description"]');
       if (metaDescription) {
         metaDescription.setAttribute('content', seoData.description);
       } else {
         const meta = document.createElement('meta');
         meta.name = 'description';
         meta.content = seoData.description;
         document.head.appendChild(meta);
       }
   
       // Update Open Graph tags
       const ogTitle = document.querySelector('meta[property="og:title"]');
       if (ogTitle) {
         ogTitle.setAttribute('content', seoData.title);
       }
   
       // Update Twitter Card tags
       const twitterTitle = document.querySelector('meta[name="twitter:title"]');
       if (twitterTitle) {
         twitterTitle.setAttribute('content', seoData.title);
       }
     }, [seoData]);
   }
   ```

2. **SEO Manager**
   ```typescript
   // src/utils/seoManager.ts
   export class SEOManager {
     static updateTitle(title: string) {
       document.title = title;
     }
   
     static updateMetaDescription(description: string) {
       let metaDescription = document.querySelector('meta[name="description"]');
       if (!metaDescription) {
         metaDescription = document.createElement('meta');
         metaDescription.setAttribute('name', 'description');
         document.head.appendChild(metaDescription);
       }
       metaDescription.setAttribute('content', description);
     }
   
     static updateFavicon(faviconUrl: string) {
       let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
       if (!favicon) {
         favicon = document.createElement('link');
         favicon.rel = 'icon';
         document.head.appendChild(favicon);
       }
       favicon.href = faviconUrl;
     }
   }
   ```

### Step 3: Analytics Integration
Implement analytics tracking:

1. **Analytics Hook**
   ```typescript
   // src/hooks/useAnalytics.ts
   import { useEffect } from 'react';
   
   export function useAnalytics() {
     const trackEvent = (eventName: string, properties?: any) => {
       if (process.env.NODE_ENV === 'production') {
         // Google Analytics
         if (typeof gtag !== 'undefined') {
           gtag('event', eventName, properties);
         }
   
         // Custom analytics
         fetch('/api/analytics', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ event: eventName, properties })
         }).catch(console.error);
       }
     };
   
     const trackPageView = (pageName: string) => {
       trackEvent('page_view', { page: pageName });
     };
   
     return { trackEvent, trackPageView };
   }
   ```

2. **Analytics Component**
   ```typescript
   // src/components/Analytics.tsx
   import { useEffect } from 'react';
   import { useAnalytics } from '../hooks/useAnalytics';
   
   interface AnalyticsProps {
     pageName: string;
   }
   
   export const Analytics = ({ pageName }: AnalyticsProps) => {
     const { trackPageView } = useAnalytics();
   
     useEffect(() => {
       trackPageView(pageName);
     }, [pageName, trackPageView]);
   
     return null;
   };
   ```

### Step 4: Environment Management
Set up proper environment configuration:

1. **Environment Configuration**
   ```typescript
   // src/config/environment.ts
   interface EnvironmentConfig {
     NODE_ENV: 'development' | 'production' | 'test';
     VITE_SUPABASE_URL: string;
     VITE_SUPABASE_ANON_KEY: string;
     VITE_ANALYTICS_ID?: string;
     VITE_SENTRY_DSN?: string;
   }
   
   export const env: EnvironmentConfig = {
     NODE_ENV: import.meta.env.MODE as any,
     VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
     VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
     VITE_ANALYTICS_ID: import.meta.env.VITE_ANALYTICS_ID,
     VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN
   };
   
   export const isDevelopment = env.NODE_ENV === 'development';
   export const isProduction = env.NODE_ENV === 'production';
   ```

2. **Environment Validation**
   ```typescript
   // src/utils/envValidation.ts
   export function validateEnvironment() {
     const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
     const missing = requiredVars.filter(varName => !import.meta.env[varName]);
   
     if (missing.length > 0) {
       throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
     }
   }
   ```

### Step 5: Security Best Practices
Implement security measures:

1. **Input Sanitization**
   ```typescript
   // src/utils/security.ts
   export const sanitizeInput = (input: string): string => {
     return input
       .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
       .replace(/<[^>]*>/g, '')
       .trim();
   };
   
   export const validateEmail = (email: string): boolean => {
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     return emailRegex.test(email);
   };
   
   export const validatePassword = (password: string): boolean => {
     return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
   };
   ```

2. **Content Security Policy**
   ```typescript
   // src/utils/csp.ts
   export const setContentSecurityPolicy = () => {
     const csp = `
       default-src 'self';
       script-src 'self' 'unsafe-inline' 'unsafe-eval';
       style-src 'self' 'unsafe-inline';
       img-src 'self' data: https:;
       connect-src 'self' https://*.supabase.co;
     `.replace(/\s+/g, ' ').trim();
   
     const meta = document.createElement('meta');
     meta.httpEquiv = 'Content-Security-Policy';
     meta.content = csp;
     document.head.appendChild(meta);
   };
   ```

### Step 6: Build Optimization
Optimize the build process:

1. **Vite Configuration**
   ```typescript
   // vite.config.ts
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react-swc';
   import { resolve } from 'path';
   
   export default defineConfig({
     plugins: [react()],
     build: {
       target: 'esnext',
       outDir: 'dist',
       sourcemap: false,
       minify: 'terser',
       rollupOptions: {
         output: {
           manualChunks: {
             vendor: ['react', 'react-dom'],
             supabase: ['@supabase/supabase-js'],
             ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
           }
         }
       }
     },
     resolve: {
       alias: {
         '@': resolve(__dirname, './src')
       }
     }
   });
   ```

2. **Bundle Analysis Script**
   ```javascript
   // scripts/analyze-bundle.js
   const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
   
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

### Step 7: Health Checks
Implement health monitoring:

1. **Health Check Endpoint**
   ```typescript
   // src/utils/healthCheck.ts
   export class HealthChecker {
     static async checkDatabase(): Promise<boolean> {
       try {
         const { data, error } = await supabase.from('profiles').select('id').limit(1);
         return !error;
       } catch {
         return false;
       }
     }
   
     static async checkAPI(): Promise<boolean> {
       try {
         const response = await fetch('/api/health');
         return response.ok;
       } catch {
         return false;
       }
     }
   
     static async runAllChecks(): Promise<{ database: boolean; api: boolean }> {
       const [database, api] = await Promise.all([
         this.checkDatabase(),
         this.checkAPI()
       ]);
   
       return { database, api };
     }
   }
   ```

### Step 8: Deployment Configuration
Set up deployment:

1. **Vercel Configuration**
   ```json
   // vercel.json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite",
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ],
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "X-Content-Type-Options",
             "value": "nosniff"
           },
           {
             "key": "X-Frame-Options",
             "value": "DENY"
           }
         ]
       }
     ]
   }
   ```

2. **Environment Variables**
   ```env
   # .env.production
   VITE_SUPABASE_URL=your_production_url
   VITE_SUPABASE_ANON_KEY=your_production_key
   VITE_ANALYTICS_ID=your_analytics_id
   VITE_SENTRY_DSN=your_sentry_dsn
   ```

### Step 9: Monitoring Setup
Implement monitoring:

1. **Performance Monitoring**
   ```typescript
   // src/utils/performanceMonitor.ts
   export class PerformanceMonitor {
     static measurePageLoad() {
       window.addEventListener('load', () => {
         const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
         const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
         
         if (loadTime > 3000) {
           console.warn('Slow page load detected:', loadTime);
         }
       });
     }
   
     static measureAPIResponse(url: string, startTime: number) {
       const endTime = performance.now();
       const duration = endTime - startTime;
       
       if (duration > 5000) {
         console.warn('Slow API response detected:', { url, duration });
       }
     }
   }
   ```

### Step 10: Testing Setup
Set up basic testing:

1. **Test Configuration**
   ```typescript
   // src/utils/testUtils.ts
   import { render, RenderOptions } from '@testing-library/react';
   import { ReactElement } from 'react';
   
   const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
     return <div>{children}</div>;
   };
   
   const customRender = (ui: ReactElement, options?: RenderOptions) =>
     render(ui, { wrapper: AllTheProviders, ...options });
   
   export * from '@testing-library/react';
   export { customRender as render };
   ```

2. **Basic Test Example**
   ```typescript
   // src/components/__tests__/Button.test.tsx
   import { render, screen } from '../../utils/testUtils';
   import { Button } from '../Button';
   
   describe('Button', () => {
     it('renders correctly', () => {
       render(<Button>Click me</Button>);
       expect(screen.getByText('Click me')).toBeInTheDocument();
     });
   });
   ```

## Expected Output
After running this prompt, you should have:

1. ✅ Comprehensive error handling and logging
2. ✅ SEO optimization with meta tags and structured data
3. ✅ Analytics integration for user tracking
4. ✅ Environment configuration and validation
5. ✅ Security measures and input sanitization
6. ✅ Optimized build configuration
7. ✅ Health check endpoints
8. ✅ Deployment configuration
9. ✅ Performance monitoring
10. ✅ Basic testing setup

## Next Steps
After completing production readiness:
- Deploy to your chosen platform (Vercel, Netlify, etc.)
- Monitor performance and errors in production
- Set up alerts for critical issues
- Plan for scaling based on usage patterns

## Notes
- All configurations are based on your working portfolio patterns
- Security measures are implemented without breaking functionality
- Monitoring is designed to be lightweight and non-intrusive
- Testing setup is minimal but provides a foundation for expansion


