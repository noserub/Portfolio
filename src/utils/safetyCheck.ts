/**
 * Safety checks that run before React mounts
 * This helps catch and recover from data corruption issues
 */

// DON'T import diagnostics here - it might cause issues during initial load
// We'll import it only when needed inside functions

// Store cleanup functions for global error handlers
let errorHandlerCleanup: (() => void) | null = null;
let rejectionHandlerCleanup: (() => void) | null = null;

// Install global error handler before anything else
if (typeof window !== 'undefined') {
  const errorHandler = (event: ErrorEvent) => {
    console.error('🚨 GLOBAL ERROR CAUGHT:', event.error);
    console.error('Message:', event.message);
    console.error('Filename:', event.filename);
    console.error('Line:', event.lineno, 'Column:', event.colno);
    
    // Show user-friendly error page
    const errorHtml = `
      <div style="
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        background: #f9fafb;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        <div style="
          max-width: 600px;
          width: 100%;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        ">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
            <div style="
              padding: 0.75rem;
              background: rgba(239, 68, 68, 0.1);
              border-radius: 9999px;
            ">
              <svg style="width: 2rem; height: 2rem; color: #ef4444;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h1 style="font-size: 1.5rem; font-weight: 700; margin: 0;">Critical Error</h1>
              <p style="color: #6b7280; margin: 0.25rem 0 0 0;">The application failed to load</p>
            </div>
          </div>
          
          <div style="
            background: rgba(239, 68, 68, 0.05);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 0.5rem;
            padding: 1rem;
            margin-bottom: 1.5rem;
          ">
            <p style="font-family: monospace; font-size: 0.875rem; color: #dc2626; margin: 0;">
              ${event.message || 'Unknown error'}
            </p>
          </div>

          <div style="margin-bottom: 1.5rem;">
            <p style="font-size: 0.875rem; color: #4b5563; margin-bottom: 1rem;">
              This error was likely caused by corrupted data from a recent import.
            </p>
            <div style="display: flex; gap: 0.75rem;">
              <button onclick="window.location.reload()" style="
                flex: 1;
                padding: 0.625rem 1rem;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 0.5rem;
                font-weight: 500;
                cursor: pointer;
                font-size: 0.875rem;
              ">
                Try Reloading
              </button>
              <button onclick="localStorage.clear(); window.location.reload();" style="
                flex: 1;
                padding: 0.625rem 1rem;
                background: #ef4444;
                color: white;
                border: none;
                border-radius: 0.5rem;
                font-weight: 500;
                cursor: pointer;
                font-size: 0.875rem;
              ">
                Clear All Data & Reset
              </button>
            </div>
          </div>

          <details style="cursor: pointer;">
            <summary style="font-size: 0.875rem; color: #6b7280; user-select: none;">
              View technical details
            </summary>
            <pre style="
              margin-top: 1rem;
              padding: 1rem;
              background: #f3f4f6;
              border-radius: 0.5rem;
              font-size: 0.75rem;
              overflow: auto;
              color: #1f2937;
            ">${event.error?.stack || event.message || 'No stack trace available'}</pre>
          </details>
        </div>
      </div>
    `;
    
    // Only replace if this is a critical error (not handled by React)
    setTimeout(() => {
      if (!document.querySelector('[data-react-root]')) {
        document.body.innerHTML = errorHtml;
      }
    }, 100);
  };
  
  const rejectionHandler = (event: PromiseRejectionEvent) => {
    console.error('🚨 UNHANDLED PROMISE REJECTION:', event.reason);
  };
  
  // Add event listeners
  window.addEventListener('error', errorHandler);
  window.addEventListener('unhandledrejection', rejectionHandler);
  
  // Store cleanup functions
  errorHandlerCleanup = () => {
    window.removeEventListener('error', errorHandler);
  };
  
  rejectionHandlerCleanup = () => {
    window.removeEventListener('unhandledrejection', rejectionHandler);
  };
}

// Cleanup function for global error handlers
export function cleanupErrorHandlers() {
  if (errorHandlerCleanup) {
    errorHandlerCleanup();
    errorHandlerCleanup = null;
  }
  
  if (rejectionHandlerCleanup) {
    rejectionHandlerCleanup();
    rejectionHandlerCleanup = null;
  }
}

export function runSafetyChecks() {
  console.log('🛡️ ========== SAFETY CHECKS ==========');
  
  try {
    // Check 1: Can we access localStorage?
    const test = localStorage.getItem('test');
    console.log('✅ localStorage accessible');
    
    // Check 2: Is there a freshImport flag?
    const freshImport = localStorage.getItem('freshImport');
    if (freshImport === 'true') {
      console.log('🔍 FRESH IMPORT DETECTED - Running inline validation...');
      
      let hasCorruption = false;
      
      // Check case studies
      const caseStudies = localStorage.getItem('caseStudies');
      if (caseStudies) {
        try {
          const parsed = JSON.parse(caseStudies);
          if (!Array.isArray(parsed)) {
            console.error('❌ Case studies data is not an array - clearing');
            localStorage.removeItem('caseStudies');
            hasCorruption = true;
          } else {
            console.log(`✅ Case studies OK: ${parsed.length} items`);
          }
        } catch (e) {
          console.error('❌ Case studies JSON invalid - clearing', e);
          localStorage.removeItem('caseStudies');
          hasCorruption = true;
        }
      }
      
      // Check design projects
      const designProjects = localStorage.getItem('designProjects');
      if (designProjects) {
        try {
          const parsed = JSON.parse(designProjects);
          if (!Array.isArray(parsed)) {
            console.error('❌ Design projects data is not an array - clearing');
            localStorage.removeItem('designProjects');
            hasCorruption = true;
          } else {
            console.log(`✅ Design projects OK: ${parsed.length} items`);
          }
        } catch (e) {
          console.error('❌ Design projects JSON invalid - clearing', e);
          localStorage.removeItem('designProjects');
          hasCorruption = true;
        }
      }
      
      // Check hero text
      const heroText = localStorage.getItem('heroText');
      if (heroText) {
        try {
          const parsed = JSON.parse(heroText);
          if (typeof parsed !== 'object' || parsed === null) {
            console.error('❌ Hero text data is not an object - clearing');
            localStorage.removeItem('heroText');
            hasCorruption = true;
          } else {
            console.log('✅ Hero text OK');
          }
        } catch (e) {
          console.error('❌ Hero text JSON invalid - clearing', e);
          localStorage.removeItem('heroText');
          hasCorruption = true;
        }
      }
      
      // Check page visibility
      const pageVisibility = localStorage.getItem('pageVisibility');
      if (pageVisibility) {
        try {
          const parsed = JSON.parse(pageVisibility);
          if (typeof parsed !== 'object' || parsed === null) {
            console.error('❌ Page visibility data is not an object - clearing');
            localStorage.removeItem('pageVisibility');
            hasCorruption = true;
          } else {
            console.log('✅ Page visibility OK');
          }
        } catch (e) {
          console.error('❌ Page visibility JSON invalid - clearing', e);
          localStorage.removeItem('pageVisibility');
          hasCorruption = true;
        }
      }
      
      if (hasCorruption) {
        console.warn('⚠️ Some imported data was corrupted and has been removed');
      }
      
      console.log('✅ Safety checks complete');
    }
    
    return true;
  } catch (e) {
    console.error('❌ Safety check failed:', e);
    
    // Last resort: try to clear the fresh import flag
    try {
      localStorage.removeItem('freshImport');
    } catch (clearError) {
      console.error('Cannot clear freshImport flag:', clearError);
    }
    
    return false;
  }
}
