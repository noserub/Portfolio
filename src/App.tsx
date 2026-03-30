import React, { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { supabase } from "./lib/supabaseClient";
import { Edit3, Eye, LogOut, Save, AlertTriangle, Moon, Sun, MoreHorizontal, Search, BookOpen, ArrowLeft, Settings, Key, RefreshCw, Mail } from "lucide-react";
import { DeferredVercelMonitoring } from "./components/DeferredVercelMonitoring";
import { 
  Header, 
  Footer,
  AnimatedBackground, 
  AbstractPattern, 
  SignIn, 
  CaseStudyPasswordPrompt, 
  SEOEditor, 
  ComponentLibrary 
} from "./components";
import Home from "./pages/Home";

const About = lazyWithRetry(() => import("./pages/About"));
const Contact = lazyWithRetry(() => import("./pages/Contact"));
const ProjectDetail = lazyWithRetry(() => import("./pages/ProjectDetail"));
const DiagnosticPage = lazyWithRetry(() => import("./pages/DiagnosticPage"));
const EmergencyRecovery = lazyWithRetry(() => import("./pages/EmergencyRecovery"));
const Messages = lazyWithRetry(() =>
  import("./pages/Messages").then((m) => ({ default: m.Messages })),
);
const SupabaseTest = lazyWithRetry(() => import("./components/SupabaseTest"));
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Switch } from "./components/ui/switch";
import { ProjectData } from "./components/ProjectImage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "./components/ui/dropdown-menu";
import { Toaster } from "./components/ui/sonner";
import { migrateResearchInsights, migrateProjectsArray, runSafetyChecks } from "./utils";
import { FLUSH_HOME_PAGE_CMS_EVENT } from "./lib/homePageContent";
import { getPortfolioOwnerUserId } from "./lib/portfolioOwner";
import { devLog } from "./lib/devLog";
import { useSiteAuth } from "./contexts/SiteAuthContext";
import { mapSupabaseProjectRowToProjectData, parseColumnsValue } from "./lib/mapSupabaseProjectRowToProjectData";
import { useAppSettings } from "./hooks/useAppSettings";
import { ProjectsProvider, useProjects } from "./contexts/ProjectsContext";
import { useContactMessages } from "./hooks/useContactMessages";
import { useScrollHideChrome } from "./hooks/useScrollHideChrome";
import { isLikelyStaleBuildChunkError, lazyWithRetry } from "./utils/lazyWithRetry";

/** Shown while lazy route chunks load — keeps layout stable vs a blank flash */
function RouteFallback() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground text-sm">
        <div
          className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"
          aria-hidden
        />
        <span>Loading…</span>
      </div>
    </div>
  );
}

// Lazy load diagnostics to avoid blocking React mount
if (typeof window !== 'undefined') {
  import("./utils/diagnostics").catch(err => {
    console.warn('Diagnostics tools failed to load:', err);
  });
}

// Run safety checks before anything else
try {
  runSafetyChecks();
} catch (err) {
  console.error('Safety checks failed:', err);
  // Continue anyway - don't block React
}

type Page = "home" | "about" | "contact" | "project-detail" | "supabase-test" | "messages";

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children?: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('❌ CRITICAL ERROR in App:', error, errorInfo);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const err = this.state.error;
      const isChunkStale = err ? isLikelyStaleBuildChunkError(err) : false;
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-card border border-border rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/10 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Something went wrong</h1>
                <p className="text-muted-foreground">The application encountered an error</p>
              </div>
            </div>
            
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="font-mono text-sm text-red-600 dark:text-red-400">
                {err?.message || 'Unknown error'}
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {isChunkStale
                  ? "This usually happens after the site was updated while this tab was still open. Reload the page to fetch the latest version."
                  : "This might be caused by corrupted data in localStorage. Try one of these options:"}
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => window.location.reload()}
                  variant="default"
                >
                  Reload Page
                </Button>
                {!isChunkStale && (
                <Button
                  onClick={() => {
                    if (confirm('This will clear all your data and reset to defaults. Are you sure?')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  variant="destructive"
                >
                  Reset All Data
                </Button>
                )}
              </div>

              {import.meta.env.DEV && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    View technical details
                  </summary>
                  <pre className="mt-4 p-4 bg-muted rounded-lg text-xs overflow-auto">
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default function App() {
  return (
    <ProjectsProvider>
      <AppShell />
    </ProjectsProvider>
  );
}

function AppShell() {
  const { isSupabaseAuthenticated } = useSiteAuth();
  const [isDiagnosticMode, setIsDiagnosticMode] = useState(false);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  
  // Check URL parameters in useEffect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const allowDevRoutes = import.meta.env.DEV;
    const diagnostic = allowDevRoutes && urlParams.get("diagnostic") === "true";
    const emergency = allowDevRoutes && urlParams.get("emergency") === "true";
    const supabaseTest = allowDevRoutes && urlParams.get("supabase") === "true";

    if (import.meta.env.DEV) {
      console.log("URL params:", { search: window.location.search, diagnostic, emergency, supabaseTest });
    }

    setIsDiagnosticMode(diagnostic);
    setIsEmergencyMode(emergency);
    if (supabaseTest) {
      setCurrentPage("supabase-test");
    }
  }, []);
  
  // Signal to pre-React loader that React has mounted
  useEffect(() => {
    console.log('✅ REACT: App component mounted');
    if (typeof window !== 'undefined' && (window as any).__reactMounted) {
      (window as any).__reactMounted();
    }
    // Prevent browser from restoring scroll position between navigations
    if ('scrollRestoration' in window.history) {
      try {
        window.history.scrollRestoration = 'manual';
      } catch {}
    }
    // Ensure we start at the top on first mount
    forceScrollToTop();
  }, []);
  
  // Move early returns to after all hooks are declared

  // Function to determine initial page from URL pathname
  const getInitialPage = (): Page => {
    const pathname = window.location.pathname;
    
    if (pathname === '/' || pathname === '') {
      return "home";
    } else if (pathname.startsWith('/project/')) {
      // Set to project-detail immediately for project URLs
      // The URL parsing will load the project data
      return "project-detail";
    } else if (pathname.startsWith('/')) {
      const page = pathname.substring(1) as Page;
      if (['about', 'contact', 'messages'].includes(page)) {
        return page;
      }
    }
    
    return "home"; // Default fallback
  };

  // Initialize state with safe defaults and error handling
  const [isInitialized, setIsInitialized] = useState(true); // Start initialized to render immediately
  const [currentPage, setCurrentPage] = useState(getInitialPage()); // Use URL-based initial state
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectUpdateCallback, setProjectUpdateCallback] = useState(null);
  
  // Utility: force scroll to top cross-browser
  const forceScrollToTop = () => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch {}
    try {
      (document.documentElement as HTMLElement).scrollTop = 0;
    } catch {}
    try {
      (document.body as HTMLElement).scrollTop = 0;
    } catch {}
  };

  // Use Supabase for app settings including logo
  const { settings, updateSettings, getCurrentUserSettings } = useAppSettings();
  const logo = settings?.logo_url;
  
  // Use projects hook for direct persistence when callback isn't available
  const { updateProject } = useProjects();
  
  // Get contact messages for unread count
  const { getUnreadCount } = useContactMessages();
  const unreadMessageCount = getUnreadCount();
  const { chromeOffscreen } = useScrollHideChrome();

  // Load settings on mount
  useEffect(() => {
    getCurrentUserSettings();
  }, []); // Empty dependency array - only run once on mount

  // Load global favicon for all visitors (including incognito)
  useEffect(() => {
    const loadGlobalFavicon = async () => {
      try {
        console.log('🔄 Loading global favicon...');
        const { getFaviconFromSupabase, updateFavicon, getSEOData } = await import('./utils/seoManager');
        const faviconUrl = await getFaviconFromSupabase();
        
        console.log('🔍 Favicon URL from Supabase:', faviconUrl);
        
        if (faviconUrl) {
          console.log('✅ Found favicon, applying to document...');
          // Update the SEO data with the favicon
          const seoData = getSEOData();
          const updatedSitewide = {
            ...seoData.sitewide,
            faviconType: 'image' as const,
            faviconImageUrl: faviconUrl
          };
          
          // Apply the favicon immediately
          updateFavicon(updatedSitewide);
          console.log('✅ Favicon applied successfully');
        } else {
          console.log('❌ No favicon in Supabase; applying sitewide from localStorage (text or image)');
          const seoData = getSEOData();
          updateFavicon(seoData.sitewide);
        }
      } catch (error) {
        console.error('❌ Error loading global favicon:', error);
        // Don't override the static favicon on error
        // The static favicon in index.html will be used
      }
    };

    // Add a small delay to ensure the page is fully loaded
    setTimeout(loadGlobalFavicon, 100);
    
    // Also try again after a longer delay in case of network issues
    setTimeout(loadGlobalFavicon, 2000);
  }, []); // Run once on mount
  
  // Debug logging removed to prevent infinite loops
  
  const [themeSource, setThemeSource] = useState<'system' | 'user'>(() => {
    try {
      const saved = localStorage.getItem('themeSource');
      return saved === 'user' ? 'user' : 'system';
    } catch {
      return 'system';
    }
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') return saved;
      // default to system preference
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) {
      console.error('Error loading theme:', e);
      return 'light';
    }
  });
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [isBlurringBackground, setIsBlurringBackground] = useState(false);
  
  // Debug background blur state changes
  useEffect(() => {
    devLog('🌫️ Background blur state changed:', isBlurringBackground);
  }, [isBlurringBackground]);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const [pendingProtectedProject, setPendingProtectedProject] = useState(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showSEOEditor, setShowSEOEditor] = useState(false);
  const [showComponentLibrary, setShowComponentLibrary] = useState(false);

  // If owner auth/edit mode becomes active, clear any stale visitor password prompt.
  useEffect(() => {
    if ((isSupabaseAuthenticated || isEditMode) && pendingProtectedProject) {
      setPendingProtectedProject(null);
    }
  }, [isSupabaseAuthenticated, isEditMode, pendingProtectedProject]);
  
  const [pageVisibility, setPageVisibility] = useState({
      about: true,
      contact: true
  });
  




  // Logo is now saved to Supabase via updateSettings

  // Function to load page visibility (can be called manually)
  const loadPageVisibility = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const ownerUserId = getPortfolioOwnerUserId(user?.id);

      devLog('📄 Loading page visibility from Supabase:', ownerUserId);

      const { data: publicData, error: publicError } = await supabase
        .from('page_visibility')
        .select('*')
        .eq('user_id', ownerUserId)
        .single();

      devLog('📄 page_visibility query:', { publicData: !!publicData, publicError });

      if (publicData && !publicError) {
        devLog('✅ Page visibility loaded from Supabase');
        setPageVisibility({
          about: publicData.about ?? true,
          contact: publicData.contact ?? true,
        });
        return;
      }

      if (publicError?.code === 'PGRST116') {
        const { data: insertData, error: insertError } = await supabase
          .from('page_visibility')
          .insert({
            user_id: ownerUserId,
            about: true,
            contact: true,
          })
          .select()
          .single();

        if (insertData && !insertError) {
          devLog('✅ Default page_visibility row created');
          setPageVisibility({
            about: insertData.about ?? true,
            contact: insertData.contact ?? true,
          });
          return;
        }
        console.warn('⚠️ Failed to create default page_visibility:', insertError);
      }

      const saved = localStorage.getItem('pageVisibility');
      if (saved) {
        const parsed = JSON.parse(saved);
        devLog('📄 Page visibility loaded from localStorage');
        setPageVisibility({
          about: parsed.about ?? true,
          contact: parsed.contact ?? true,
        });
      } else {
        devLog('📄 Using default page visibility');
        setPageVisibility({
          about: true,
          contact: true,
        });
      }
    } catch (error) {
      console.error('❌ Error loading page visibility:', error);
      // Fallback to localStorage on error
      const saved = localStorage.getItem('pageVisibility');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPageVisibility({
          about: parsed.about ?? true,
          contact: parsed.contact ?? true
        });
      } else {
        // Ultimate fallback to defaults
        setPageVisibility({
      about: true,
      contact: true
        });
      }
    }
  };

  // Load page visibility from Supabase and localStorage
  useEffect(() => {
    loadPageVisibility();
  }, []);

  // Load page visibility when switching to preview mode
  useEffect(() => {
    if (!isEditMode) {
      devLog('🔄 Preview mode — reloading page visibility');
      loadPageVisibility();
    }
  }, [isEditMode]);

  // Save page visibility to both localStorage and Supabase
  useEffect(() => {
    const savePageVisibility = async () => {
      try {
        // Always save to localStorage first
        localStorage.setItem('pageVisibility', JSON.stringify(pageVisibility));
        devLog('💾 Page visibility saved to localStorage');

        const { data: { user } } = await supabase.auth.getUser();
        const ownerUserId = getPortfolioOwnerUserId(user?.id);

        devLog('💾 Saving page visibility to Supabase:', ownerUserId);

        const { error: updateError } = await supabase
          .from('page_visibility')
          .update({
            about: pageVisibility.about,
            contact: pageVisibility.contact,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', ownerUserId);

        if (updateError) {
          const { error: insertError } = await supabase
            .from('page_visibility')
            .insert({
              user_id: ownerUserId,
              about: pageVisibility.about,
              contact: pageVisibility.contact,
            });

          if (insertError) {
            console.warn('⚠️ Failed to save page visibility to Supabase (RLS issue):', insertError.message);
            devLog('💾 Page visibility local only (RLS)');
          } else {
            devLog('✅ Page visibility created in Supabase');
          }
        } else {
          devLog('✅ Page visibility updated in Supabase');
        }
      } catch (error) {
        console.warn('⚠️ Page visibility save failed:', error);
        devLog('💾 Page visibility saved to localStorage only');
      }
    };
    
    savePageVisibility();
  }, [pageVisibility]);

  // Apply theme to document and save to localStorage
  useEffect(() => {
    const root = document.documentElement;
    const effectiveTheme = themeSource === 'system'
      ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;

    if (effectiveTheme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');

    localStorage.setItem('theme', theme);
    localStorage.setItem('themeSource', themeSource);
  }, [theme, themeSource]);

  // Listen for system theme changes when themeSource is 'system'
  useEffect(() => {
    if (themeSource !== 'system' || typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      setSystemPrefersDark(mql.matches);
      setTheme(mql.matches ? 'dark' : 'light');
    };
    try {
      mql.addEventListener?.('change', handler);
    } catch {
      // Safari fallback
      mql.addListener?.(handler as any);
    }
    handler();
    return () => {
      try { mql.removeEventListener?.('change', handler); } catch { mql.removeListener?.(handler as any); }
    };
  }, [themeSource]);

  useEffect(() => {
    // Skip if already initialized
    const isInitialized = sessionStorage.getItem('appInitialized');
    if (isInitialized) {
      return;
    }
    
    try {
      console.log('🔄 Running one-time initialization...');
      
      // Check if this is first load (no case studies exist)
      const caseStudiesData = localStorage.getItem('caseStudies');
      if (!caseStudiesData) {
        localStorage.setItem('caseStudies', JSON.stringify([]));
      }
      
      // FIX SECTION POSITIONS: Only run once ever
      if (localStorage.getItem('positionsMigrated') !== 'true') {
        const data = localStorage.getItem('caseStudies');
        if (data) {
          try {
            const projects = JSON.parse(data);
            let updated = false;
            
            const fixedProjects = projects.map((project: any) => {
              if (!project.solutionCardsPosition || project.solutionCardsPosition < 900) {
                updated = true;
                return {
                  ...project,
                  projectImagesPosition: 2
                  // Removed hardcoded solutionCardsPosition and flowDiagramsPosition
                };
              }
              return project;
            });
            
            if (updated) {
              localStorage.setItem('caseStudies', JSON.stringify(fixedProjects));
            }
            
            // Mark migration as complete
            localStorage.setItem('positionsMigrated', 'true');
          } catch (e) {
            console.warn('Migration failed:', e);
          }
        }
      }
      
      // Migrate video fields if not already done
      if (localStorage.getItem('videoFieldsMigrated') !== 'true') {
        try {
          console.log('🔄 Running video fields migration...');
          
          // Migrate case studies
          const caseStudiesData = localStorage.getItem('caseStudies');
          if (caseStudiesData) {
            const caseStudies = JSON.parse(caseStudiesData);
            if (Array.isArray(caseStudies)) {
              const migrated = migrateProjectsArray(caseStudies);
              localStorage.setItem('caseStudies', JSON.stringify(migrated));
              console.log(`✅ Migrated ${migrated.length} case studies with video fields`);
            }
          }
          
          // Migrate design projects
          const designProjectsData = localStorage.getItem('designProjects');
          if (designProjectsData) {
            const designProjects = JSON.parse(designProjectsData);
            if (Array.isArray(designProjects)) {
              const migrated = migrateProjectsArray(designProjects);
              localStorage.setItem('designProjects', JSON.stringify(migrated));
              console.log(`✅ Migrated ${migrated.length} design projects with video fields`);
            }
          }
          
          localStorage.setItem('videoFieldsMigrated', 'true');
        } catch (e) {
          console.warn('Video fields migration failed:', e);
        }
      }
      
      // Clean up any stale migration flags
      try {
        localStorage.removeItem('needsSolutionHighlights');
      } catch (e) {
        // Ignore
      }
      
      // Handle fresh import notification
      
      // Mark as initialized for this session
      sessionStorage.setItem('appInitialized', 'true');
      console.log('✅ Initialization complete');
      
    } catch (err) {
      console.error('Initialization error:', err);
      // Mark as initialized anyway to prevent retry loops
      sessionStorage.setItem('appInitialized', 'true');
    }
  }, []); // Empty dependency array - only runs once

  // Always scroll to top when page or project changes (defeat layout shifts)
  useEffect(() => {
    forceScrollToTop();
    requestAnimationFrame(forceScrollToTop);
    setTimeout(forceScrollToTop, 0);
    setTimeout(forceScrollToTop, 32);
  }, [currentPage, (selectedProject as any)?._navTimestamp]);

  // Browser navigation support
  useEffect(() => {
    // Update URL when currentPage changes
    const updateURL = () => {
      let newPath = '/';
      
      if (currentPage === "home") {
        newPath = '/';
      } else if (currentPage === "project-detail") {
        if (selectedProject) {
          // Create friendly URL from project title
          const friendlySlug = selectedProject.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .trim();
          newPath = `/project/${friendlySlug}`;
        } else {
          // If we're on project-detail but no project is selected, check if we're already on a project URL
          const currentPath = window.location.pathname;
          if (currentPath.startsWith('/project/')) {
            // We're already on a project URL, don't change it
            return;
          } else {
            // We're on project-detail but not on a project URL, don't update URL yet
            // Let the URL parsing handle it - this prevents premature redirects
            return;
          }
        }
      } else {
        newPath = `/${currentPage}`;
      }
      
      // Only update URL if it's different to avoid infinite loops
      if (window.location.pathname !== newPath) {
        window.history.pushState({ page: currentPage, project: selectedProject?.id }, '', newPath);
      }
    };

    // Only update URL if we're not in the middle of initial page load
    // This prevents premature URL updates that cause routing issues
    const isInitialLoad = !selectedProject && currentPage === "project-detail";
    if (!isInitialLoad) {
      updateURL();
    }
  }, [currentPage, selectedProject]);

  // Calculate current route for Analytics component
  const getCurrentRoute = (): string => {
    // Skip tracking on initial load for project-detail without project
    if (!selectedProject && currentPage === "project-detail") {
      return '/';
    }
    
    // Get the current path from pathname or default to home
    if (currentPage === "home") {
      return '/';
    } else if (currentPage === "project-detail" && selectedProject) {
      // Create friendly slug for project pages
      const friendlySlug = selectedProject.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      return `/project/${friendlySlug}`;
    } else if (currentPage === "about") {
      return '/about';
    } else if (currentPage === "contact") {
      return '/contact';
    } else if (currentPage === "messages") {
      return '/messages';
    }
    
    return '/';
  };

  const currentRoute = getCurrentRoute();
  const currentRouteRef = useRef(currentRoute);
  
  // Keep ref updated with current route
  useEffect(() => {
    currentRouteRef.current = currentRoute;
  }, [currentRoute]);

  // Debug: Verify Speed Insights is loading
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if Speed Insights is loaded
      const checkSpeedInsights = () => {
        const hasSpeedInsights = !!(window as any).__VERCEL_SPEED_INSIGHTS__;
        const isProduction = import.meta.env.MODE === 'production';
        console.log('🔍 Speed Insights check:', {
          hasSpeedInsights,
          isProduction,
          currentRoute,
          userAgent: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other'
        });
      };
      
      // Check immediately and after a delay
      checkSpeedInsights();
      setTimeout(checkSpeedInsights, 2000);
    }
  }, [currentRoute]);

  // Track page views for Vercel Analytics (browser-based routing)
  // Manual tracking ensures all route changes are captured for analytics
  useEffect(() => {
    // Skip tracking on initial load for project-detail without project
    if (!selectedProject && currentPage === "project-detail") {
      return;
    }
    
    const path = currentRoute;
    
    if (!path || typeof window === 'undefined') {
      return;
    }
    
    // Track page view using Vercel Analytics
    // Use a small delay to ensure the page has fully rendered and Analytics is loaded
    const timeoutId = setTimeout(() => {
      try {
        // Use the Vercel Analytics API to track page views
        // window.va is injected by the Analytics component
        if (typeof window !== 'undefined' && window.va) {
          window.va('pageview', { url: path });
        } else {
          // If va isn't loaded yet, queue it
          if (!window.vaq) {
            window.vaq = [];
          }
          window.vaq.push(['pageview', { url: path }]);
        }
      } catch (error) {
        console.error('Error tracking pageview:', error);
      }
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [currentRoute, currentPage, selectedProject]);

  // Function to create friendly slug from title
  const createSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  };

  // Function to find project by friendly slug
  const findProjectBySlug = async (slug: string): Promise<ProjectData | null> => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      let rows: Record<string, unknown>[] | null = null;

      if (authUser.user) {
        const { data, error } = await supabase.from("projects").select("*");
        if (data && !error) rows = data as Record<string, unknown>[];
      } else {
        const { data, error } = await supabase.rpc("get_projects_public");
        if (data && !error) rows = data as Record<string, unknown>[];
      }

      if (rows?.length) {
        const raw = rows.find((p) => createSlug(String(p.title ?? "")) === slug);
        if (raw) return mapSupabaseProjectRowToProjectData(raw);
      }
      
      // If not found in Supabase, try localStorage
      const caseStudies = localStorage.getItem('caseStudies');
      if (caseStudies) {
        const projects = JSON.parse(caseStudies);
        const project = projects.find((p: any) => createSlug(p.title) === slug);
        if (project) return project;
      }
      
      const designProjects = localStorage.getItem('designProjects');
      if (designProjects) {
        const projects = JSON.parse(designProjects);
        const project = projects.find((p: any) => createSlug(p.title) === slug);
        if (project) return project;
      }
      
      return null;
    } catch (error) {
      console.error('Error finding project by slug:', error);
      return null;
    }
  };

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handlePopState = async (event: PopStateEvent) => {
      const pathname = window.location.pathname;
      
      if (pathname === '/' || pathname === '') {
        // Home page
        setCurrentPage("home");
        setSelectedProject(null);
      } else if (pathname.startsWith('/project/')) {
        // Project detail page — use same password gate + Supabase refresh as Home card clicks
        const projectSlug = pathname.split('/project/')[1];
        if (projectSlug) {
          const project = await findProjectBySlug(projectSlug);
          if (project) {
            await navigateToProject(project as ProjectData, () => {});
          } else {
            console.warn('Project not found:', projectSlug);
            setCurrentPage("home");
            setSelectedProject(null);
          }
        }
      } else if (pathname.startsWith('/')) {
        // Other pages
        const page = pathname.substring(1) as Page;
        if (['about', 'contact', 'messages'].includes(page)) {
          setCurrentPage(page);
          setSelectedProject(null);
        } else {
          // Unknown route, redirect to home
          setCurrentPage("home");
          setSelectedProject(null);
        }
      }
      // Ensure scroll top after navigation caused by browser buttons
      setTimeout(forceScrollToTop, 0);
    };

    // Listen for browser navigation
    window.addEventListener('popstate', handlePopState);
    
    // Parse initial URL on page load
    const pathname = window.location.pathname;
    if (pathname.startsWith('/project/')) {
      // If we're on a project page, we need to load the project data
      handlePopState({} as PopStateEvent);
    } else if (pathname !== '/' && pathname !== '') {
      // Handle any other pathname-based routing
      handlePopState({} as PopStateEvent);
    }
    // For home page, the initial state is already correct

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // NOW ALL HOOKS ARE DECLARED - SAFE TO DO CONDITIONAL RENDERING
  // If in emergency mode, show emergency recovery
  if (isEmergencyMode) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <EmergencyRecovery />
      </Suspense>
    );
  }

  // If in diagnostic mode, show diagnostic page
  if (isDiagnosticMode) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <DiagnosticPage />
      </Suspense>
    );
  }
  
  // Supabase test mode removed - now using integrated hooks in components

  const handleLogoUpload = async (file: File) => {
    try {
      console.log('📤 Starting logo upload:', file.name, file.type, file.size);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (PNG, JPG, GIF, etc.)');
        return;
      }
      
      // Convert file to base64 data URL with multiple event handlers
      const reader = new FileReader();
      
      reader.onloadstart = () => {
        console.log('🔄 FileReader started reading file');
      };
      
      reader.onprogress = () => {
        console.log('📊 FileReader progress...');
      };
      
      reader.onload = async () => {
        console.log('✅ FileReader onload triggered');
        const logoUrl = reader.result as string;
        console.log('🖼️ Logo converted to base64, length:', logoUrl.length);
        console.log('🖼️ Logo preview:', logoUrl.substring(0, 100) + '...');
        
        // Save to localStorage (for immediate local updates)
        localStorage.setItem('portfolio_logo_url', logoUrl);
        console.log('✅ Logo saved to localStorage');
        
        // Also try to save to database (for other devices)
        try {
          const { data: { user } } = await supabase.auth.getUser();
          const ownerId = getPortfolioOwnerUserId(user?.id);

          const { error: updateError } = await supabase
            .from("app_settings")
            .update({ logo_url: logoUrl })
            .eq("user_id", ownerId);

          if (updateError) {
            const { error: insertError } = await supabase.from("app_settings").insert({
              user_id: ownerId,
              logo_url: logoUrl,
              theme: "dark",
              is_authenticated: false,
              show_debug_panel: false,
            });

            if (insertError) {
              console.log("⚠️ Could not save logo to database (RLS issue), localStorage still works:", insertError);
              alert(`Logo saved locally but failed to save to database: ${insertError.message}`);
            } else {
              alert("✅ Logo saved to database successfully!");
            }
          } else {
            alert("✅ Logo updated in database successfully!");
          }
        } catch (dbError) {
          console.log("⚠️ Database save failed, but localStorage works:", dbError);
        }
        
        console.log('🔄 Logo saved to localStorage, will be loaded on next render');
        
        // Show success message and reload to update the logo
        alert('Logo uploaded successfully! Reloading to show your logo...');
        window.location.reload();
      };
      
      reader.onloadend = () => {
        console.log('🏁 FileReader onloadend triggered');
      };
      
      reader.onerror = () => {
        console.error('❌ Error reading file');
        alert('Error reading the selected file. Please try a different image.');
      };
      
      reader.onabort = () => {
        console.error('❌ FileReader aborted');
        alert('File reading was aborted. Please try again.');
      };
      
      console.log('🚀 Starting to read file as data URL...');
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Error uploading logo. Please try again.');
    }
  };

  const navigateToStart = () => {
    setCurrentPage("about");
    setTimeout(forceScrollToTop, 0);
  };

  // Supabase test navigation removed

  const navigateHome = () => {
    setCurrentPage("home");
    setSelectedProject(null);
    setTimeout(forceScrollToTop, 0);
  };

  const navigateToProject = async (project: ProjectData, updateCallback: (project: ProjectData) => void) => {
    const raw = project as any;
    const projectNav = {
      ...project,
      requiresPassword: Boolean(raw.requiresPassword ?? raw.requires_password),
    } as ProjectData;

    // Try to load fresh data from Supabase first
    let freshProject: ProjectData | null = null;
    
    try {
      const { data: authUser } = await supabase.auth.getUser();
      let data: Record<string, unknown> | null = null;
      let error: { message?: string } | null = null;

      if (authUser.user) {
        const res = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectNav.id)
          .single();
        data = res.data as Record<string, unknown> | null;
        error = res.error;
      } else {
        const res = await supabase.rpc("get_project_by_id_public", { p_id: projectNav.id });
        const rows = res.data as Record<string, unknown>[] | null;
        data = rows?.[0] ?? null;
        error = res.error;
      }

      if (data && !error) {
        freshProject = mapSupabaseProjectRowToProjectData(data);
        if (import.meta.env.DEV) {
          console.log("Loaded project from Supabase:", freshProject.id);
        }
      } else {
        console.log("⚠️ Supabase load failed, falling back to localStorage");
      }
    } catch (e) {
      console.error("Error loading from Supabase:", e);
    }
    
    // If Supabase failed, try localStorage as fallback
    if (!freshProject) {
    try {
      console.log('🔄 Supabase load failed, trying localStorage fallback...');
      
      // Try case studies first
      const caseStudiesData = localStorage.getItem('caseStudies');
      console.log('🔄 localStorage caseStudies data:', caseStudiesData ? 'found' : 'not found');
      if (caseStudiesData) {
        const caseStudies = JSON.parse(caseStudiesData);
        if (Array.isArray(caseStudies)) {
          console.log('🔄 Searching caseStudies for project:', projectNav.id);
          freshProject = caseStudies.find((p: ProjectData) => p.id === projectNav.id);
          console.log('🔄 Found in caseStudies:', freshProject ? 'yes' : 'no');
        }
      }
      
      // If not found, try design projects
      if (!freshProject) {
        const designProjectsData = localStorage.getItem('designProjects');
        console.log('🔄 localStorage designProjects data:', designProjectsData ? 'found' : 'not found');
        if (designProjectsData) {
          const designProjects = JSON.parse(designProjectsData);
          if (Array.isArray(designProjects)) {
            console.log('🔄 Searching designProjects for project:', projectNav.id);
            freshProject = designProjects.find((p: ProjectData) => p.id === projectNav.id);
            console.log('🔄 Found in designProjects:', freshProject ? 'yes' : 'no');
          }
        }
      }
      
      // Ensure requiresPassword field is properly set for localStorage fallback
      if (freshProject) {
        freshProject.requiresPassword = freshProject.requiresPassword || freshProject.requires_password || false;
        console.log('🔄 localStorage fallback - ensuring requiresPassword field:', freshProject.requiresPassword);
      } else {
        console.log('🔄 localStorage fallback - project not found in localStorage');
      }
    } catch (e) {
        console.error('Error loading project data from localStorage:', e);
      }
    }
    
    // Use fresh data if found, otherwise use the project passed in
    const projectToSet = freshProject || projectNav;
    
    // Ensure requiresPassword field is properly set even when using original project
    if (!freshProject) {
      projectToSet.requiresPassword = Boolean(
        projectToSet.requiresPassword ?? (projectToSet as any).requires_password
      );
      console.log('🔄 Using original project - ensuring requiresPassword field:', projectToSet.requiresPassword);
    }
    
    devLog('📂 Loading project:', {
      id: projectToSet.id,
      title: projectToSet.title,
      imageCount: projectToSet.caseStudyImages?.length || 0,
      requiresPassword: projectToSet.requiresPassword,
      hasSupabaseSession: isSupabaseAuthenticated,
    });

    // Password-protected case studies: visitors must unlock.
    // Owners in edit mode should never be blocked by visitor password prompts.
    const shouldRequireProjectPassword = Boolean(projectToSet.requiresPassword) && !isSupabaseAuthenticated && !isEditMode;
    if (shouldRequireProjectPassword) {
      setPendingProtectedProject({ project: projectToSet, updateCallback });
      return;
    }
    
    // Add a navigation timestamp to force remount when coming back to the same project
    setSelectedProject({
      ...projectToSet,
      _navTimestamp: Date.now() // This will force a new key without affecting the actual data
    } as any);
    setProjectUpdateCallback({ fn: updateCallback });
    setCurrentPage("project-detail");
    setTimeout(forceScrollToTop, 0);
  };

  const handleUnlockCaseStudy = async (passwordFromPrompt: string): Promise<boolean> => {
    if (!pendingProtectedProject) return false;
    const { project, updateCallback } = pendingProtectedProject;
    const { data, error } = await supabase.rpc("unlock_project_with_password", {
      p_project_id: project.id,
      p_password: passwordFromPrompt.trim(),
    });
    if (error) {
      console.error("unlock_project_with_password failed:", error);
      return false;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      return false;
    }
    const mapped = mapSupabaseProjectRowToProjectData(row as Record<string, unknown>);
    setPendingProtectedProject(null);
    setSelectedProject({
      ...mapped,
      _navTimestamp: Date.now(),
    } as any);
    setProjectUpdateCallback({ fn: updateCallback });
    setCurrentPage("project-detail");
    setTimeout(forceScrollToTop, 0);
    return true;
  };

  const handlePasswordCancel = () => {
    setPendingProtectedProject(null);
  };

  const handleUpdateProject = async (updatedProject: ProjectData) => {
    if (!isEditMode) {
      console.warn('🛑 Ignoring project update while preview mode is active');
      return;
    }

    const { _navTimestamp, ...cleanProject } = updatedProject as any;
    
    const sanitizedProject = {
      ...cleanProject,
    } as ProjectData & Record<string, any>;

    const rawKeyFeaturesColumns = (cleanProject as any).keyFeaturesColumns ?? (cleanProject as any).key_features_columns;
    if (rawKeyFeaturesColumns !== undefined) {
      const normalizedKeyFeaturesColumns = parseColumnsValue(rawKeyFeaturesColumns, [2, 3], 3);
      sanitizedProject.keyFeaturesColumns = normalizedKeyFeaturesColumns as any;
      sanitizedProject.key_features_columns = normalizedKeyFeaturesColumns as any;
    }

    const rawResearchInsightsColumns = (cleanProject as any).researchInsightsColumns ?? (cleanProject as any).research_insights_columns;
    if (rawResearchInsightsColumns !== undefined) {
      const normalizedResearchInsightsColumns = parseColumnsValue(rawResearchInsightsColumns, [1, 2, 3], 3);
      sanitizedProject.researchInsightsColumns = normalizedResearchInsightsColumns as any;
      sanitizedProject.research_insights_columns = normalizedResearchInsightsColumns as any;
    }

    const rawSolutionCardsPosition = cleanProject.solutionCardsPosition ?? (cleanProject as any).solution_cards_position;
    if (rawSolutionCardsPosition !== undefined) {
      sanitizedProject.solutionCardsPosition = rawSolutionCardsPosition;
      sanitizedProject.solution_cards_position = rawSolutionCardsPosition;
    }

    // Keep a small local revision history per project for emergency recovery.
    // This runs before persistence so we can roll back accidental writes.
    try {
      const revisionsKey = `projectRevisions:${sanitizedProject.id}`;
      const existingRaw = localStorage.getItem(revisionsKey);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const nextRevision = {
        timestamp: new Date().toISOString(),
        title: sanitizedProject.title,
        data: sanitizedProject,
      };
      const revisions = Array.isArray(existing) ? [...existing, nextRevision] : [nextRevision];
      const capped = revisions.slice(-20);
      localStorage.setItem(revisionsKey, JSON.stringify(capped));
    } catch (revisionError) {
      console.warn('Failed to store local project revision snapshot:', revisionError);
    }
    
    setSelectedProject({
      ...sanitizedProject,
      _navTimestamp: (selectedProject as any)?._navTimestamp || Date.now()
    } as any);
    
    if (projectUpdateCallback) {
      projectUpdateCallback.fn(sanitizedProject);
    
      // Silent verification - log warnings to console only (no annoying alerts)
      setTimeout(() => {
        try {
          const caseStudiesData = localStorage.getItem('caseStudies');
          if (caseStudiesData) {
            const caseStudies = JSON.parse(caseStudiesData);
            const savedProject = caseStudies.find((p: ProjectData) => p.id === sanitizedProject.id);
            
            if (!savedProject) {
              console.warn('⚠️ Save verification: Project not found in localStorage after save');
            } else if ((sanitizedProject.caseStudyImages?.length || 0) !== (savedProject?.caseStudyImages?.length || 0)) {
              console.warn('⚠️ Save verification: Image count mismatch', {
                expected: sanitizedProject.caseStudyImages?.length || 0,
                actual: savedProject?.caseStudyImages?.length || 0
              });
            } else {
              console.log('✅ Save verified successfully');
            }
          }
        } catch (e) {
          console.warn('Save verification failed:', e);
        }
      }, 100);
      
      setShowSaveIndicator(true);
      setTimeout(() => setShowSaveIndicator(false), 3000);
    } else {
      // Fallback: persist directly to Supabase if callback isn't available
      console.log('⚠️ No update callback available, persisting directly to Supabase');
      try {
        // Convert camelCase to snake_case for Supabase
        const projectData: any = {
          title: sanitizedProject.title,
          description: sanitizedProject.description,
          url: sanitizedProject.url,
          position_x: sanitizedProject.position?.x || 50,
          position_y: sanitizedProject.position?.y || 50,
          scale: sanitizedProject.scale || 1,
          published: sanitizedProject.published || false,
          requires_password: sanitizedProject.requiresPassword || false,
          password: (sanitizedProject as any).password || '',
          case_study_content: sanitizedProject.caseStudyContent,
          case_study_images: sanitizedProject.caseStudyImages || [],
          flow_diagram_images: sanitizedProject.flowDiagramImages || [],
          video_items: sanitizedProject.videoItems || [],
          gallery_aspect_ratio: sanitizedProject.galleryAspectRatio || '3x4',
          flow_diagram_aspect_ratio: sanitizedProject.flowDiagramAspectRatio || '3x4',
          video_aspect_ratio: sanitizedProject.videoAspectRatio || '3x4',
          gallery_columns: sanitizedProject.galleryColumns || 1,
          flow_diagram_columns: sanitizedProject.flowDiagramColumns || 1,
          video_columns: sanitizedProject.videoColumns || 1,
          project_images_position: sanitizedProject.projectImagesPosition,
          videos_position: sanitizedProject.videosPosition,
          flow_diagrams_position: sanitizedProject.flowDiagramsPosition,
          section_positions: sanitizedProject.sectionPositions || {},
          case_study_sidebars: (sanitizedProject as any).caseStudySidebars || (sanitizedProject as any).case_study_sidebars || undefined,
          sort_order: (sanitizedProject as any).sortOrder || 0,
          project_type: sanitizedProject.projectType || (sanitizedProject as any).project_type || null
        };
        
        if ((sanitizedProject as any).keyFeaturesColumns !== undefined) {
          projectData.key_features_columns = parseColumnsValue((sanitizedProject as any).keyFeaturesColumns, [2, 3], 3);
        }

        if ((sanitizedProject as any).researchInsightsColumns !== undefined) {
          projectData.research_insights_columns = parseColumnsValue((sanitizedProject as any).researchInsightsColumns, [1, 2, 3], 3);
        }

        if ((sanitizedProject as any).solutionCardsPosition !== undefined) {
          projectData.solution_cards_position = sanitizedProject.solutionCardsPosition;
        }

        projectData.case_study_decorative_icons = Boolean(
          sanitizedProject.caseStudyDecorativeIcons ?? (sanitizedProject as any).case_study_decorative_icons
        );
        
        await updateProject(sanitizedProject.id, projectData);
        console.log('✅ Project persisted directly to Supabase:', { id: sanitizedProject.id, hasSidebars: !!projectData.case_study_sidebars });
        setShowSaveIndicator(true);
        setTimeout(() => setShowSaveIndicator(false), 3000);
      } catch (error) {
        console.error('❌ Failed to persist project directly to Supabase:', error);
      }
    }
  };

  /** Called after `SignIn` succeeds (`signInWithPassword`); session is established in Supabase. */
  const handleSignIn = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setShowSignIn(false);
    if (user) {
      setIsEditMode(true);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
      setIsEditMode(false);
      devLog('👋 Signed out');
    } catch (error) {
      console.error('Error during sign out:', error);
      setIsEditMode(false);
    }
  };

  // Handle page visibility changes
  const handlePageVisibilityChange = async (page: keyof typeof pageVisibility) => {
    const newVisibility = { ...pageVisibility, [page]: !pageVisibility[page] };
    setPageVisibility(newVisibility);
    
    // The useEffect will handle saving to both localStorage and Supabase
    devLog(`📄 Page visibility changed: ${String(page)} = ${newVisibility[page]}`);
  };

  // Removed unused import function - data now saved to Supabase automatically

  const handleEditModeClick = () => {
    if (!isSupabaseAuthenticated) {
      setShowSignIn(true);
    } else {
      const newMode = !isEditMode;
      
      if (isEditMode && !newMode) {
        const hasUnsavedChanges = checkForUnsavedChanges();

        if (hasUnsavedChanges) {
          const confirmed = confirm(
            '⚠️ You have unsaved changes!\n\n' +
            'Are you sure you want to exit edit mode? Your changes will be lost.\n\n' +
            'Click "OK" to discard changes and exit edit mode.\n' +
            'Click "Cancel" to stay in edit mode and save your changes.',
          );

          if (!confirmed) {
            console.log('👁️ User cancelled exit edit mode - staying in edit mode');
            return;
          }
          console.log('⚠️ User confirmed exit edit mode - discarding unsaved changes');
        } else {
          window.dispatchEvent(new Event(FLUSH_HOME_PAGE_CMS_EVENT));
        }
      }

      setIsEditMode(newMode);
      
      // When switching to preview mode, log current state
      if (!newMode) {
        console.log('👁️ Switching to Preview Mode');
        console.log('📊 Current localStorage data:');
        const caseStudies = localStorage.getItem('caseStudies');
        const designProjects = localStorage.getItem('designProjects');
        if (caseStudies) {
          const parsed = JSON.parse(caseStudies);
          console.log('  - Case Studies:', parsed.length, 'projects');
          parsed.forEach((p: any) => {
            console.log(`    • ${p.title}: ${p.caseStudyImages?.length || 0} images, ${p.caseStudyContent?.length || 0} chars`);
          });
        }
        if (designProjects) {
          const parsed = JSON.parse(designProjects);
          console.log('  - Design Projects:', parsed.length, 'projects');
        }
      }
    }
  };

  // Helper function to check for unsaved changes
  const checkForUnsavedChanges = () => {
    // Check if there are any pending auto-saves or unsaved changes
    const hasLocalChanges = document.querySelector('[data-unsaved="true"]');
    const hasPendingSaves = localStorage.getItem('pendingChanges');
    
    // Check if there are any recent image uploads that might not be saved
    const recentImageUploads = document.querySelectorAll('[data-recent-upload="true"]');
    
    // Check if there are any unsaved form changes
    const hasUnsavedForms = document.querySelectorAll('input[data-changed="true"], textarea[data-changed="true"]');
    
    const hasChanges = hasLocalChanges || hasPendingSaves || recentImageUploads.length > 0 || hasUnsavedForms.length > 0;
    
    if (hasChanges) {
      console.log('🔍 Unsaved changes detected:', {
        hasLocalChanges: !!hasLocalChanges,
        hasPendingSaves: !!hasPendingSaves,
        recentUploads: recentImageUploads.length,
        unsavedForms: hasUnsavedForms.length
      });
    }
    
    return hasChanges;
  };

  // No loading screen - render immediately for better performance
  
  // Debug log to verify render is called
  // Debug logging removed to prevent infinite loops
  
  // Safeguard: Check if localStorage is accessible
  try {
    const test = localStorage.getItem('test');
  } catch (e) {
    console.error('❌ localStorage is not accessible:', e);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-card border border-border rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-red-500/10 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">localStorage Error</h1>
              <p className="text-muted-foreground">Cannot access browser storage</p>
            </div>
          </div>
          <p className="text-sm mb-4">
            This app requires localStorage to function. Please check your browser settings and reload.
          </p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      </div>
    );
  }

  const pillNavPages = [
    { key: "about" as const, label: "About", visible: isEditMode || pageVisibility.about },
    { key: "contact" as const, label: "Contact", visible: isEditMode || pageVisibility.contact },
  ].filter((page) => page.visible);
  const showPillNav =
    currentPage !== "home" && currentPage !== "project-detail" && pillNavPages.length > 1;

  return (
    <ErrorBoundary>
      <div className="min-h-screen relative" data-react-root="true">
        
        {/* Fixed backgrounds that show on all pages */}
        <AnimatedBackground />
        <AbstractPattern />
      
      {/* Sign In Modal */}
      {showSignIn && (
        <SignIn 
          onSignIn={handleSignIn} 
          onCancel={() => setShowSignIn(false)}
        />
      )}
      
      {/* Case Study Password Prompt */}
      <AnimatePresence>
        {pendingProtectedProject && (
          <CaseStudyPasswordPrompt
            projectTitle={pendingProtectedProject.project.title}
            onUnlock={handleUnlockCaseStudy}
            onCancel={handlePasswordCancel}
          />
        )}
      </AnimatePresence>
      
      {/* SEO Editor */}
      <SEOEditor 
        isOpen={showSEOEditor}
        onClose={() => setShowSEOEditor(false)}
      />
      
      
      {/* Top chrome: slides up on scroll down, returns on scroll up (see useScrollHideChrome).
          Transform is inline — Tailwind may not emit -translate-y-full in the CSS bundle. */}
      <div
        className="fixed top-0 left-0 right-0 z-50 pointer-events-none will-change-transform"
        style={{
          transform: chromeOffscreen ? "translateY(-100%)" : "translateY(0)",
          transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="pointer-events-auto">
          <div className="relative">
            <Header
              logo={logo}
              onLogoUpload={handleLogoUpload}
              onLogoClick={navigateHome}
              isEditMode={isEditMode}
            />

      {/* Header Controls - Top Left */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute top-6 left-6 z-50 flex items-center gap-3"
      >
        {/* Back Button - Only show on non-home pages */}
        {currentPage !== "home" && (
          <Button
            onClick={(e) => {
              navigateHome();
              e.currentTarget.blur(); // Remove focus after click
            }}
            variant="secondary"
            className="rounded-full shadow-lg backdrop-blur-sm p-2.5"
            aria-label="Go back to home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}

        {/* Theme Toggle */}
        <Button
          onClick={(e) => {
            // user toggles lock themeSource to 'user'
            setThemeSource('user');
            setTheme(theme === 'light' ? 'dark' : 'light');
            e.currentTarget.blur(); // Remove focus after click
          }}
          variant="secondary"
          className="rounded-full shadow-lg backdrop-blur-sm p-2.5"
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={theme}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Light Mode</span>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Save Indicator - Top Right Corner */}
      <AnimatePresence>
        {showSaveIndicator && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-24 right-6 z-50 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-sm border-2 border-green-400"
          >
            <div className="flex items-center gap-3">
              <Save className="w-5 h-5" />
              <div>
                <div className="font-bold text-base">
                  Changes Saved to Supabase!
                </div>
                <div className="text-xs opacity-90 mt-0.5">
                  Data automatically saved to database
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Mode Toggle & Status - Top Right */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute top-6 right-6 z-50 flex flex-col items-end gap-3"
      >
        <div className="flex items-center gap-2">
          {/* Email icon with badge - only show when authenticated */}
          {isSupabaseAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage("messages")}
              className={`rounded-full shadow-lg backdrop-blur-sm p-2.5 relative ${
                isEditMode 
                  ? "bg-primary/10 text-primary hover:bg-primary/20" 
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              } transition-colors`}
              aria-label="Messages"
            >
              <Mail className="w-5 h-5" />
              {unreadMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                  {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                </span>
              )}
            </Button>
          )}
          
          {/* Overflow menu with three dots (both desktop and mobile) */}
          <DropdownMenu>
            <DropdownMenuTrigger
            className={`rounded-full shadow-lg backdrop-blur-sm p-2.5 inline-flex items-center justify-center ${
              isEditMode 
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            } transition-colors`}
            aria-label="Menu"
            onMouseUp={(e) => e.currentTarget.blur()} // Remove focus after mouse click
          >
            <MoreHorizontal className="w-5 h-5" />
          </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
            {/* Edit/Preview Toggle */}
            <DropdownMenuItem 
              onClick={(e) => {
                handleEditModeClick();
                setTimeout(() => document.activeElement instanceof HTMLElement && document.activeElement.blur(), 0);
              }}
            >
              {isEditMode ? "Preview Mode" : (isSupabaseAuthenticated ? "Edit Mode" : "Sign In")}
            </DropdownMenuItem>
            
            {/* Page Visibility Section - Only in Edit Mode */}
            {isSupabaseAuthenticated && isEditMode && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">Page Visibility</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageVisibilityChange('about');
                    setTimeout(() => document.activeElement instanceof HTMLElement && document.activeElement.blur(), 0);
                  }}
                  className="flex items-center justify-between"
                >
                  <span>About Page</span>
                  <Switch 
                    checked={pageVisibility.about}
                    onCheckedChange={() => handlePageVisibilityChange('about')}
                    className="ml-2"
                  />
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageVisibilityChange('contact');
                    setTimeout(() => document.activeElement instanceof HTMLElement && document.activeElement.blur(), 0);
                  }}
                  className="flex items-center justify-between"
                >
                  <span>Contact Page</span>
                  <Switch 
                    checked={pageVisibility.contact}
                    onCheckedChange={() => handlePageVisibilityChange('contact')}
                    className="ml-2"
                  />
                </DropdownMenuItem>
              </>
            )}
            
            {/* Theme Settings - Available to all users */}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={(e) => {
                setThemeSource('system');
                e.currentTarget.blur();
              }}
            >
              {systemPrefersDark ? (
                <Moon className="w-4 h-4 mr-2" />
              ) : (
                <Sun className="w-4 h-4 mr-2" />
              )}
              System Theme (auto)
            </DropdownMenuItem>
            
            {/* Settings Section - Authenticated users only */}
            {isSupabaseAuthenticated && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        setShowPasswordReset(!showPasswordReset);
                        setTimeout(() => document.activeElement instanceof HTMLElement && document.activeElement.blur(), 0);
                      }}
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Case Study Password
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        setShowSEOEditor(true);
                        setTimeout(() => document.activeElement instanceof HTMLElement && document.activeElement.blur(), 0);
                      }}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      SEO Settings
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </>
            )}
            
            {/* Edit Mode Tools */}
            {isEditMode && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => {
                    window.location.reload();
                    setTimeout(() => document.activeElement instanceof HTMLElement && document.activeElement.blur(), 0);
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    setShowComponentLibrary(true);
                    setTimeout(() => document.activeElement instanceof HTMLElement && document.activeElement.blur(), 0);
                  }}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Component Library
                </DropdownMenuItem>
              </>
            )}
            
            {/* Sign Out */}
            {isSupabaseAuthenticated && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => {
                    handleSignOut();
                    setTimeout(() => document.activeElement instanceof HTMLElement && document.activeElement.blur(), 0);
                  }}
                  className="text-foreground"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </motion.div>

          </div>

          {isEditMode && (
            <div className="w-full z-40 bg-pink-400 text-black text-sm font-medium py-2 px-4 text-center">
              Editing mode is active
            </div>
          )}

          {showPillNav && (
            <motion.nav
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="hidden lg:flex justify-center pb-2 pt-1 pointer-events-auto h-[54px] items-center gap-2 bg-card/80 backdrop-blur-lg border border-border rounded-full shadow-2xl px-1 py-1 mx-auto mb-1 w-auto max-w-full"
            >
              {pillNavPages.map((page) => (
                <motion.button
                  key={page.key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    setCurrentPage(page.key);
                    e.currentTarget.blur();
                  }}
                  className={`px-6 py-2.5 rounded-full transition-all duration-200 font-bold compact-focus h-[48px] flex items-center justify-center my-0.5 ${
                    currentPage === page.key
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:scale-[1.02]"
                  } ${isEditMode && !pageVisibility[page.key] ? "opacity-50 border border-dashed border-yellow-500" : ""}`}
                >
                  {page.label}
                  {isEditMode && !pageVisibility[page.key] && (
                    <span className="ml-2 text-xs">📝</span>
                  )}
                </motion.button>
              ))}
            </motion.nav>
          )}
        </div>
      </div>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {showPasswordReset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={() => setShowPasswordReset(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4">Case Study Password</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Set or reset the password required to view password-protected case studies. 
                Default password is "0p3n".
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newPassword.trim()) {
                    localStorage.setItem('caseStudyPassword', newPassword);
                    alert('Password updated successfully!');
                    setNewPassword("");
                    setShowPasswordReset(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="newPassword" className="block mb-2 text-sm font-medium">
                    New Password
                  </label>
                  <Input
                    id="newPassword"
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoFocus
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs text-blue-900 dark:text-blue-100">
                    <strong>Current password:</strong> {localStorage.getItem('caseStudyPassword') || '0p3n (default)'}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">
                    Update Password
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (confirm('Reset to default password "0p3n"?')) {
                        localStorage.removeItem('caseStudyPassword');
                        alert('Password reset to default: 0p3n');
                        setNewPassword("");
                        setShowPasswordReset(false);
                      }
                    }}
                    className="flex-1"
                  >
                    Reset to Default
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setNewPassword("");
                    setShowPasswordReset(false);
                  }}
                  className="w-full"
                >
                  Cancel
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DndProvider backend={HTML5Backend}>
        <div className="relative z-10">
        <Suspense fallback={<RouteFallback />}>
          {currentPage === "home" && (
            <Home 
              onStartClick={navigateToStart} 
              isEditMode={isEditMode}
              onProjectClick={navigateToProject}
              currentPage={currentPage}
            />
          )}
          {currentPage === "about" && (isEditMode || pageVisibility.about) && (
            <About onBack={navigateHome} onHoverChange={setIsBlurringBackground} isEditMode={isEditMode} />
          )}
          {currentPage === "contact" && (isEditMode || pageVisibility.contact) && (
            <Contact onBack={navigateHome} isEditMode={isEditMode} />
          )}
          {currentPage === "messages" && isSupabaseAuthenticated && (
            <Messages onBack={navigateHome} isEditMode={isEditMode} />
          )}
          {currentPage === "project-detail" && selectedProject && (
            <div key={(selectedProject as any)._navTimestamp || selectedProject.id}>
              <ProjectDetail
                project={selectedProject}
                onBack={navigateHome}
                onUpdate={handleUpdateProject}
                isEditMode={isEditMode}
              />
            </div>
          )}
          {currentPage === "supabase-test" && <SupabaseTest />}
        </Suspense>
          {/* Supabase test page removed */}
      </div>
      </DndProvider>

      {showPillNav && (
        <motion.nav
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:hidden bg-card/80 backdrop-blur-lg border border-border rounded-full shadow-2xl px-1 py-1 flex items-center gap-2 z-40 h-[54px]"
        >
          {pillNavPages.map((page) => (
            <motion.button
              key={page.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                setCurrentPage(page.key);
                e.currentTarget.blur();
              }}
              className={`px-6 py-2.5 rounded-full transition-all duration-200 font-bold compact-focus h-[48px] flex items-center justify-center my-0.5 ${
                currentPage === page.key
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:scale-[1.02]"
              } ${isEditMode && !pageVisibility[page.key] ? "opacity-50 border border-dashed border-yellow-500" : ""}`}
            >
              {page.label}
              {isEditMode && !pageVisibility[page.key] && (
                <span className="ml-2 text-xs">📝</span>
              )}
            </motion.button>
          ))}
        </motion.nav>
      )}
      </div>

      {/* Footer - shown on all pages */}
      <Footer />

      {/* Component Library Modal */}
      <ComponentLibrary 
        isOpen={showComponentLibrary} 
        onClose={() => setShowComponentLibrary(false)} 
      />
      
      {/* Toast notifications */}
      <Toaster position="bottom-right" />
      
      <DeferredVercelMonitoring route={currentRoute} />
    </ErrorBoundary>
  );
}
