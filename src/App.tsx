import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { supabase } from "./lib/supabaseClient";
import { Edit3, Eye, LogOut, Save, AlertTriangle, Moon, Sun, MoreHorizontal, Search, BookOpen, ArrowLeft, Settings, Key, RefreshCw } from "lucide-react";
import { Analytics } from "@vercel/analytics/react";
import { 
  Header, 
  AnimatedBackground, 
  AbstractPattern, 
  SignIn, 
  CaseStudyPasswordPrompt, 
  SEOEditor, 
  ComponentLibrary 
} from "./components";
import SupabaseTest from "./components/SupabaseTest";
import { 
  Home, 
  About, 
  Contact, 
  ProjectDetail, 
  DiagnosticPage, 
  EmergencyRecovery 
} from "./pages";
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
import { useAppSettings } from "./hooks/useAppSettings";

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

type Page = "home" | "about" | "contact" | "project-detail" | "supabase-test";

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
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This might be caused by corrupted data in localStorage. Try one of these options:
              </p>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => window.location.reload()}
                  variant="default"
                >
                  Reload Page
                </Button>
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
              </div>

              <details className="mt-6">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  View technical details
                </summary>
                <pre className="mt-4 p-4 bg-muted rounded-lg text-xs overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default function App() {
  const [isDiagnosticMode, setIsDiagnosticMode] = useState(false);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  
  // Check URL parameters in useEffect
  useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
    const diagnostic = urlParams.get('diagnostic') === 'true';
    const emergency = urlParams.get('emergency') === 'true';
    const supabase = urlParams.get('supabase') === 'true';
    
    console.log('🔍 URL params:', {
      search: window.location.search,
      diagnostic,
      emergency,
      supabase
    });
    
    setIsDiagnosticMode(diagnostic);
    setIsEmergencyMode(emergency);
    if (supabase) {
      setCurrentPage('supabase-test');
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

  // Initialize state with safe defaults and error handling
  const [isInitialized, setIsInitialized] = useState(true); // Start initialized to render immediately
  const [currentPage, setCurrentPage] = useState("home");
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
          console.log('❌ No favicon found in Supabase, keeping static favicon');
          // Don't override the static favicon if no custom one is found
          // The static favicon in index.html will be used
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
    console.log('🌫️ Background blur state changed:', isBlurringBackground);
    console.log('🎨 CSS classes being applied:', isBlurringBackground 
      ? 'opacity-100 bg-white/10 dark:bg-black/10' 
      : 'opacity-0 bg-transparent'
    );
    console.log('🔍 Filter styles being applied:', isBlurringBackground 
      ? 'blur(8px) saturate(120%)' 
      : 'blur(0px) saturate(100%)'
    );
  }, [isBlurringBackground]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication state on mount and listen for changes
  useEffect(() => {
    // Check current auth state
    const checkAuthState = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const isBypassAuth = localStorage.getItem('isAuthenticated') === 'true';
      const isAuth = !!user || isBypassAuth;
      setIsAuthenticated(isAuth);
      console.log('🔐 Initial auth check:', { 
        isAuthenticated: isAuth, 
        user: user?.email, 
        bypassAuth: isBypassAuth,
        authType: user ? 'Supabase' : (isBypassAuth ? 'Bypass' : 'None')
      });
    };

    checkAuthState();

  // Listen for Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Supabase auth state changed:', { event, user: session?.user?.email });
      
      const isSupabaseAuth = !!session?.user;
      const isBypassAuth = localStorage.getItem('isAuthenticated') === 'true';
      const isAuth = isSupabaseAuth || isBypassAuth;
      setIsAuthenticated(isAuth);
      
      if (isSupabaseAuth) {
        localStorage.setItem('isAuthenticated', 'true');
        console.log('✅ Signed in - authentication persisted to localStorage');
      } else {
        // Only clear localStorage if we're actually signing out, not just checking auth state
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('isAuthenticated');
        console.log('👋 Signed out - authentication cleared from localStorage');
        } else {
          console.log('🔍 Auth state changed but not signing out, keeping bypass auth if present');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const [pendingProtectedProject, setPendingProtectedProject] = useState(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showSEOEditor, setShowSEOEditor] = useState(false);
  const [showComponentLibrary, setShowComponentLibrary] = useState(false);
  
  const [pageVisibility, setPageVisibility] = useState({
      about: true,
      contact: true
  });
  




  // Logo is now saved to Supabase via updateSettings

  // Function to load page visibility (can be called manually)
  const loadPageVisibility = async () => {
    try {
      // Try to load from Supabase (prioritize public access for consistency)
      const { data: { user } } = await supabase.auth.getUser();
      const isBypassAuth = localStorage.getItem('isAuthenticated') === 'true';
      const fallbackUserId = '7cd2752f-93c5-46e6-8535-32769fb10055';
      
      console.log('📄 Loading page visibility from Supabase (public access):', fallbackUserId);
      console.log('📄 User auth state:', { user: user?.id, isBypassAuth, fallbackUserId });
      
      // Try public access first (for consistency between authenticated and incognito users)
      const { data: publicData, error: publicError } = await supabase
        .from('page_visibility')
        .select('*')
        .eq('user_id', fallbackUserId)
        .single();
        
        console.log('📄 Public access query result:', { publicData, publicError });
          
        if (publicData && !publicError) {
          console.log('✅ Page visibility loaded from Supabase (public):', publicData);
          setPageVisibility({
            about: publicData.about ?? true,
            contact: publicData.contact ?? true
          });
          return;
        } else {
          console.log('❌ Public access failed:', publicError);
          // If no public record exists, create one with default values
          if (publicError?.code === 'PGRST116') {
            console.log('📝 No public page visibility record found, creating default record...');
            
            // Create default record in Supabase
            const { data: insertData, error: insertError } = await supabase
              .from('page_visibility')
              .insert({
                user_id: fallbackUserId,
                about: true,
                contact: true
              })
              .select()
              .single();
              
            if (insertData && !insertError) {
              console.log('✅ Default page visibility record created in Supabase:', insertData);
              setPageVisibility({
                about: insertData.about ?? true,
                contact: insertData.contact ?? true
              });
              return;
            } else {
              console.warn('⚠️ Failed to create default page visibility record:', insertError);
            }
          }
        }
      
      // Fallback to authenticated user's data if public data not found
      if (user || isBypassAuth) {
        console.log('📄 Trying authenticated user data as fallback...');
        const { data, error } = await supabase
          .from('page_visibility')
          .select('*')
          .eq('user_id', user?.id || fallbackUserId)
          .single();
          
        if (data && !error) {
          console.log('✅ Page visibility loaded from Supabase (authenticated):', data);
          setPageVisibility({
            about: data.about ?? true,
            contact: data.contact ?? true
          });
          return;
        }
      }
      
      // Fallback to localStorage
      const saved = localStorage.getItem('pageVisibility');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('📄 Page visibility loaded from localStorage:', parsed);
        setPageVisibility({
          about: parsed.about ?? true,
          contact: parsed.contact ?? true
        });
      } else {
        // Ultimate fallback to defaults
        console.log('📄 Using default page visibility values');
        setPageVisibility({
      about: true,
      contact: true
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
      console.log('🔄 Switching to preview mode - reloading page visibility...');
      loadPageVisibility();
    }
  }, [isEditMode]);

  // Save page visibility to both localStorage and Supabase
  useEffect(() => {
    const savePageVisibility = async () => {
      try {
        // Always save to localStorage first
    localStorage.setItem('pageVisibility', JSON.stringify(pageVisibility));
        console.log('💾 Page visibility saved to localStorage');
        
        // Try to save to Supabase for shared access (always use fallback user ID for public access)
        const { data: { user } } = await supabase.auth.getUser();
        const isBypassAuth = localStorage.getItem('isAuthenticated') === 'true';
        const fallbackUserId = '7cd2752f-93c5-46e6-8535-32769fb10055';
        
        console.log('💾 Saving page visibility to Supabase for shared access (public):', fallbackUserId);
        
        // Always save to the fallback user ID so incognito users can access it
        const { error: updateError } = await supabase
          .from('page_visibility')
          .update({
            about: pageVisibility.about,
            contact: pageVisibility.contact,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', fallbackUserId);
          
        if (updateError) {
          console.log('📝 Page visibility record not found, creating new one...');
          // If record doesn't exist, create it
          const { error: insertError } = await supabase
            .from('page_visibility')
            .insert({
              user_id: fallbackUserId,
              about: pageVisibility.about,
              contact: pageVisibility.contact,
            });
            
          if (insertError) {
            console.warn('⚠️ Failed to save page visibility to Supabase (RLS issue):', insertError.message);
            console.log('💾 Page visibility saved to localStorage only due to RLS restrictions');
          } else {
            console.log('✅ Page visibility created in Supabase (public)');
          }
        } else {
          console.log('✅ Page visibility updated in Supabase (public)');
        }
      } catch (error) {
        console.warn('⚠️ Page visibility save failed:', error);
        console.log('💾 Page visibility saved to localStorage only');
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
    const handler = () => setTheme(mql.matches ? 'dark' : 'light');
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
      const baseUrl = window.location.origin + window.location.pathname;
      let newUrl = baseUrl;
      
      if (currentPage === "home") {
        newUrl = baseUrl;
      } else if (currentPage === "project-detail" && selectedProject) {
        // Create friendly URL from project title
        const friendlySlug = selectedProject.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single
          .trim();
        newUrl = `${baseUrl}#/project/${friendlySlug}`;
      } else {
        newUrl = `${baseUrl}#/${currentPage}`;
      }
      
      // Only update URL if it's different to avoid infinite loops
      if (window.location.href !== newUrl) {
        window.history.pushState({ page: currentPage, project: selectedProject?.id }, '', newUrl);
      }
    };

    updateURL();
  }, [currentPage, selectedProject]);

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
      // First try Supabase
      const { data, error } = await supabase
        .from('projects')
        .select('*');
      
      if (data && !error) {
        const project = data.find((p: any) => createSlug(p.title) === slug);
        if (project) return project as ProjectData;
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
      const hash = window.location.hash;
      
      if (hash === '' || hash === '#') {
        // Home page
        setCurrentPage("home");
        setSelectedProject(null);
      } else if (hash.startsWith('#/project/')) {
        // Project detail page
        const projectSlug = hash.split('/project/')[1];
        if (projectSlug) {
          const project = await findProjectBySlug(projectSlug);
          if (project) {
            setSelectedProject(project);
            setCurrentPage("project-detail");
          } else {
            console.warn('Project not found:', projectSlug);
            setCurrentPage("home");
            setSelectedProject(null);
          }
        }
      } else if (hash.startsWith('#/')) {
        // Other pages
        const page = hash.substring(2) as Page;
        if (['about', 'contact'].includes(page)) {
          setCurrentPage(page);
          setSelectedProject(null);
        }
      }
      // Ensure scroll top after navigation caused by browser buttons
      setTimeout(forceScrollToTop, 0);
    };

    // Listen for browser navigation
    window.addEventListener('popstate', handlePopState);
    
    // Parse initial URL on page load
    const hash = window.location.hash;
    if (hash !== '' && hash !== '#') {
      handlePopState({} as PopStateEvent);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // NOW ALL HOOKS ARE DECLARED - SAFE TO DO CONDITIONAL RENDERING
  // If in emergency mode, show emergency recovery
  if (isEmergencyMode) {
    return <EmergencyRecovery />;
  }
  
  // If in diagnostic mode, show diagnostic page
  if (isDiagnosticMode) {
    return <DiagnosticPage />;
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
          // Get the main user's profile
          const { data: mainProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', 'brian.bureson@gmail.com')
            .single();
            
          if (mainProfile) {
            // Try to update existing settings
            const { error: updateError } = await supabase
              .from('app_settings')
              .update({ logo_url: logoUrl })
              .eq('user_id', mainProfile.id);
              
            if (updateError) {
              console.log('📝 No existing settings, creating new ones...');
              console.log('🔍 Update error:', updateError);
              // If update fails, try to insert new settings
              const { error: insertError } = await supabase
                .from('app_settings')
                .insert({
                  user_id: mainProfile.id,
                  logo_url: logoUrl,
                  theme: 'dark',
                  is_authenticated: false,
                  show_debug_panel: false
                });
                
              if (insertError) {
                console.log('⚠️ Could not save to database (RLS issue), but localStorage works');
                console.log('🔍 Insert error:', insertError);
                alert(`Logo saved locally but failed to save to database: ${insertError.message}`);
        } else {
                console.log('✅ Logo saved to database');
                alert('✅ Logo saved to database successfully!');
              }
            } else {
              console.log('✅ Logo updated in database');
              alert('✅ Logo updated in database successfully!');
            }
          }
        } catch (dbError) {
          console.log('⚠️ Database save failed, but localStorage works:', dbError);
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
    // Try to load fresh data from Supabase first
    let freshProject: ProjectData | null = null;
    
    try {
      console.log('🔄 Loading fresh project data from Supabase...');
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', project.id)
        .single();
      
      if (data && !error) {
        console.log('✅ Loaded fresh data from Supabase:', data.id);
        
        // Convert Supabase snake_case format to UI camelCase format
        freshProject = {
          ...data,
          // Convert position fields
          position: { x: data.position_x || 50, y: data.position_y || 50 },
          // Convert content fields
          caseStudyContent: data.case_study_content,
          caseStudyImages: data.case_study_images || [],
          flowDiagramImages: data.flow_diagram_images || [],
          videoItems: data.video_items || [],
          // Convert aspect ratio fields
          galleryAspectRatio: data.gallery_aspect_ratio,
          flowDiagramAspectRatio: data.flow_diagram_aspect_ratio,
          videoAspectRatio: data.video_aspect_ratio,
          // Convert column fields
          galleryColumns: data.gallery_columns,
          flowDiagramColumns: data.flow_diagram_columns,
          videoColumns: data.video_columns,
          // Convert position fields
          projectImagesPosition: data.project_images_position,
          videosPosition: data.videos_position,
          flowDiagramsPosition: data.flow_diagrams_position,
          solutionCardsPosition: data.solution_cards_position,
          // Convert other fields
          sectionPositions: data.section_positions || {},
          requiresPassword: data.requires_password,
          // Remove snake_case fields to avoid confusion
          position_x: undefined,
          position_y: undefined,
          case_study_content: undefined,
          case_study_images: undefined,
          flow_diagram_images: undefined,
          video_items: undefined,
          gallery_aspect_ratio: undefined,
          flow_diagram_aspect_ratio: undefined,
          video_aspect_ratio: undefined,
          gallery_columns: undefined,
          flow_diagram_columns: undefined,
          video_columns: undefined,
          project_images_position: undefined,
          videos_position: undefined,
          flow_diagrams_position: undefined,
          solution_cards_position: undefined,
          section_positions: undefined,
          requires_password: undefined
        };
        
        if (freshProject) {
          console.log('🔄 Converted Supabase data to UI format:', {
            id: freshProject.id,
            imageCount: freshProject.caseStudyImages?.length || 0,
            hasImages: (freshProject.caseStudyImages?.length || 0) > 0,
            originalImages: data.case_study_images?.length || 0,
            convertedImages: freshProject.caseStudyImages?.length || 0,
            imageData: freshProject.caseStudyImages
          });
        }
      } else {
        console.log('⚠️ Supabase load failed, falling back to localStorage');
      }
    } catch (e) {
      console.error('Error loading from Supabase:', e);
    }
    
    // If Supabase failed, try localStorage as fallback
    if (!freshProject) {
    try {
      // Try case studies first
      const caseStudiesData = localStorage.getItem('caseStudies');
      if (caseStudiesData) {
        const caseStudies = JSON.parse(caseStudiesData);
        if (Array.isArray(caseStudies)) {
          freshProject = caseStudies.find((p: ProjectData) => p.id === project.id);
        }
      }
      
      // If not found, try design projects
      if (!freshProject) {
        const designProjectsData = localStorage.getItem('designProjects');
        if (designProjectsData) {
          const designProjects = JSON.parse(designProjectsData);
          if (Array.isArray(designProjects)) {
            freshProject = designProjects.find((p: ProjectData) => p.id === project.id);
          }
        }
      }
    } catch (e) {
        console.error('Error loading project data from localStorage:', e);
      }
    }
    
    // Use fresh data if found, otherwise use the project passed in
    const projectToSet = freshProject || project;
    
    console.log('📂 Loading project:', {
      id: projectToSet.id,
      imageCount: projectToSet.caseStudyImages?.length || 0,
      imageIds: projectToSet.caseStudyImages?.map(img => img.id) || [],
      source: freshProject ? 'Supabase' : 'localStorage',
      requiresPassword: projectToSet.requiresPassword,
      isAuthenticated: isAuthenticated
    });
    
    // Check if project requires password and user is not authenticated (site owner)
    // Site owners can view password-protected projects in both edit and preview modes
    if (projectToSet.requiresPassword && !isAuthenticated) {
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

  const handlePasswordCorrect = () => {
    if (pendingProtectedProject) {
      const { project, updateCallback } = pendingProtectedProject;
      setSelectedProject({
        ...project,
        _navTimestamp: Date.now()
      } as any);
      setProjectUpdateCallback({ fn: updateCallback });
      setCurrentPage("project-detail");
      setPendingProtectedProject(null);
    }
  };

  const handlePasswordCancel = () => {
    setPendingProtectedProject(null);
  };

  const handleUpdateProject = (updatedProject: ProjectData) => {
    const { _navTimestamp, ...cleanProject } = updatedProject as any;
    
    setSelectedProject({
      ...cleanProject,
      _navTimestamp: (selectedProject as any)?._navTimestamp || Date.now()
    } as any);
    
    if (projectUpdateCallback) {
      projectUpdateCallback.fn(cleanProject);
      
      // Silent verification - log warnings to console only (no annoying alerts)
      setTimeout(() => {
        try {
          const caseStudiesData = localStorage.getItem('caseStudies');
          if (caseStudiesData) {
            const caseStudies = JSON.parse(caseStudiesData);
            const savedProject = caseStudies.find((p: ProjectData) => p.id === cleanProject.id);
            
            if (!savedProject) {
              console.warn('⚠️ Save verification: Project not found in localStorage after save');
            } else if ((cleanProject.caseStudyImages?.length || 0) !== (savedProject?.caseStudyImages?.length || 0)) {
              console.warn('⚠️ Save verification: Image count mismatch', {
                expected: cleanProject.caseStudyImages?.length || 0,
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
      console.error('⚠️ ERROR: Cannot save - no update callback!');
    }
  };

  const handleSignIn = async (password: string) => {
    console.log('🔐 handleSignIn called with password:', password);
    
    if (password === 'brian2025') {
      // Real authentication with your account
      try {
        console.log('🔐 REAL AUTH: Signing in with brian.bureson@gmail.com...');
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'brian.bureson@gmail.com',
          password: 'brian2025'
        });
        
        if (error) {
          console.error('❌ REAL AUTH: Failed to sign in:', error);
          // Try to create the account if it doesn't exist
          console.log('🔄 REAL AUTH: Trying to create account...');
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: 'brian.bureson@gmail.com',
            password: 'brian2025'
          });
          
          if (signUpError) {
            console.error('❌ REAL AUTH: Failed to create account:', signUpError);
            throw new Error('Failed to authenticate or create account');
          } else {
            console.log('✅ REAL AUTH: Account created successfully');
          }
        } else {
          console.log('✅ REAL AUTH: Successfully signed in with real account');
        }
      } catch (err) {
        console.error('❌ REAL AUTH: Authentication failed:', err);
        throw new Error('Authentication failed');
      }
    }
    
    setIsAuthenticated(true);
    // Persist authentication to localStorage
    localStorage.setItem('isAuthenticated', 'true');
    setShowSignIn(false);
    // Automatically enable edit mode after signing in
    setIsEditMode(true);
    console.log('✅ Signed in - authentication persisted to localStorage');
    console.log('✅ Authentication state updated:', { isAuthenticated: true, isEditMode: true });
  };

  const handleSignOut = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
      
      // Clear local state
    setIsAuthenticated(false);
    setIsEditMode(false);
    localStorage.removeItem('isAuthenticated');
      console.log('👋 Signed out - authentication cleared from Supabase and localStorage');
    } catch (error) {
      console.error('Error during sign out:', error);
      // Still clear local state even if Supabase sign out fails
      setIsAuthenticated(false);
      setIsEditMode(false);
      localStorage.removeItem('isAuthenticated');
    }
  };

  // Handle page visibility changes
  const handlePageVisibilityChange = async (page: keyof typeof pageVisibility) => {
    const newVisibility = { ...pageVisibility, [page]: !pageVisibility[page] };
    setPageVisibility(newVisibility);
    
    // The useEffect will handle saving to both localStorage and Supabase
    console.log(`📄 Page visibility changed: ${String(page)} = ${newVisibility[page]}`);
  };

  // Removed unused import function - data now saved to Supabase automatically

  const handleEditModeClick = () => {
    if (!isAuthenticated) {
      setShowSignIn(true);
    } else {
      const newMode = !isEditMode;
      
      // When switching FROM edit mode TO preview mode, check for unsaved changes
      if (isEditMode && !newMode) {
        // Check if there are any unsaved changes
        const hasUnsavedChanges = checkForUnsavedChanges();
        
        if (hasUnsavedChanges) {
          const confirmed = confirm(
            '⚠️ You have unsaved changes!\n\n' +
            'Are you sure you want to exit edit mode? Your changes will be lost.\n\n' +
            'Click "OK" to discard changes and exit edit mode.\n' +
            'Click "Cancel" to stay in edit mode and save your changes.'
          );
          
          if (!confirmed) {
            console.log('👁️ User cancelled exit edit mode - staying in edit mode');
            return; // Don't exit edit mode
          } else {
            console.log('⚠️ User confirmed exit edit mode - discarding unsaved changes');
          }
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
            onCorrectPassword={handlePasswordCorrect}
            onCancel={handlePasswordCancel}
          />
        )}
      </AnimatePresence>
      
      {/* SEO Editor */}
      <SEOEditor 
        isOpen={showSEOEditor}
        onClose={() => setShowSEOEditor(false)}
      />
      
      
      {/* Header - separate from content to avoid z-index stacking context issues */}
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
        className="fixed top-6 left-6 z-50 flex items-center gap-3"
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
            className="fixed top-24 right-6 z-50 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-sm border-2 border-green-400"
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
        className="fixed top-6 right-6 z-50 flex flex-col items-end gap-3"
      >
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
              {isEditMode ? "Preview Mode" : (isAuthenticated ? "Edit Mode" : "Sign In")}
            </DropdownMenuItem>
            
            {/* Page Visibility Section */}
            {isAuthenticated && !isEditMode && (
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
            
            {/* Settings Section */}
            {isAuthenticated && (
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
                        setThemeSource('system');
                        e.currentTarget.blur();
                      }}
                    >
                      System Theme (auto)
                    </DropdownMenuItem>
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
            {isAuthenticated && (
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
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed left-0 right-0 z-40 bg-pink-400 text-black text-sm font-medium py-2 px-4 text-center"
            style={{ top: '85px' }}
          >
            Editing mode is active
          </motion.div>
        )}
      </motion.div>


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
          {currentPage === "supabase-test" && (
            <SupabaseTest />
          )}
          {/* Supabase test page removed */}
      </div>
      </DndProvider>

      {currentPage !== "home" && currentPage !== "project-detail" && (() => {
        // Filter visible pages based on edit mode and page visibility
        const visiblePages = [
          { key: 'about', label: 'About', visible: isEditMode || pageVisibility.about },
          { key: 'contact', label: 'Contact', visible: isEditMode || pageVisibility.contact }
        ].filter(page => page.visible);

        // Only show navigation if there are 2 or more visible pages
        if (visiblePages.length <= 1) return null;

        return (
          <motion.nav
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:bottom-auto lg:top-[6.5rem] bg-card/80 backdrop-blur-lg border border-border rounded-full shadow-2xl px-1 py-1 flex items-center gap-2 z-40 h-[54px]"
          >
            {visiblePages.map(page => (
              <motion.button
                key={page.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  setCurrentPage(page.key as Page);
                  e.currentTarget.blur(); // Remove focus after click
                }}
                className={`px-6 py-2.5 rounded-full transition-all duration-200 font-bold compact-focus h-[48px] flex items-center justify-center my-0.5 ${
                  currentPage === page.key
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:scale-[1.02]"
                } ${isEditMode && !pageVisibility[page.key as keyof typeof pageVisibility] ? 'opacity-50 border border-dashed border-yellow-500' : ''}`}
              >
                {page.label}
                {isEditMode && !pageVisibility[page.key as keyof typeof pageVisibility] && (
                  <span className="ml-2 text-xs">📝</span>
                )}
              </motion.button>
            ))}
          </motion.nav>
        );
      })()}
      </div>

      {/* Component Library Modal */}
      <ComponentLibrary 
        isOpen={showComponentLibrary} 
        onClose={() => setShowComponentLibrary(false)} 
      />
      
      {/* Toast notifications */}
      <Toaster position="bottom-right" />
      
      {/* Vercel Analytics */}
      <Analytics />
    </ErrorBoundary>
  );
}