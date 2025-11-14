// SEO Manager - Manages SEO metadata for all pages
import { supabase } from '../lib/supabaseClient';

export interface SEOData {
  title: string;
  description: string;
  keywords: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
}

export interface SitewideSEO {
  siteName: string;
  siteUrl: string;
  defaultAuthor: string;
  defaultOGImage: string;
  defaultTwitterCard: 'summary' | 'summary_large_image';
  faviconType?: 'text' | 'image'; // Type of favicon to use
  faviconText?: string; // Text to display in favicon (default: "BB")
  faviconGradientStart?: string; // Hex color for gradient start (default: "#8b5cf6")
  faviconGradientEnd?: string; // Hex color for gradient end (default: "#3b82f6")
  faviconImageUrl?: string; // Custom favicon image (data URI or URL)
}

export interface AllSEOData {
  sitewide: SitewideSEO;
  pages: {
    home: SEOData;
    about: SEOData;
    caseStudies: SEOData;
    contact: SEOData;
  };
  caseStudyDefaults: SEOData; // Template for individual case studies
}

// Get site URL from environment or use default
const getSiteUrl = (): string => {
  if (typeof window !== 'undefined') {
    // In browser: use current origin, or fallback to default
    const origin = window.location.origin;
    if (origin && origin !== 'http://localhost:3000' && origin !== 'http://localhost:5173') {
      return origin;
    }
  }
  // Fallback to default (can be overridden via localStorage or environment variable at build time)
  return 'https://brianbureson.com';
};

const DEFAULT_SEO_DATA: AllSEOData = {
  sitewide: {
    siteName: 'Brian Bureson - Product Design Leader',
    siteUrl: getSiteUrl(),
    defaultAuthor: 'Brian Bureson',
    defaultOGImage: `${getSiteUrl()}/api/og?title=Brian%20Bureson%20-%20Product%20Design%20Leader`,
    defaultTwitterCard: 'summary_large_image',
    faviconType: 'text',
    faviconText: 'BB',
    faviconGradientStart: '#8b5cf6',
    faviconGradientEnd: '#3b82f6',
    faviconImageUrl: '',
  },
  pages: {
    home: {
      title: 'Brian Bureson - Product Design Leader',
      description: 'Portfolio of Brian Bureson, an experienced product design leader specializing in user-centered design, design systems, and innovative digital experiences.',
      keywords: 'product design, UX design, design leadership, portfolio, Brian Bureson, user experience, design systems',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      twitterCard: 'summary_large_image',
      twitterTitle: '',
      twitterDescription: '',
      twitterImage: '',
      canonicalUrl: '',
    },
    about: {
      title: 'About - Brian Bureson',
      description: 'Learn more about Brian Bureson, a product design leader with a passion for creating meaningful user experiences and leading design teams.',
      keywords: 'about Brian Bureson, design leader, UX designer, product designer',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      twitterCard: 'summary_large_image',
      twitterTitle: '',
      twitterDescription: '',
      twitterImage: '',
      canonicalUrl: '',
    },
    caseStudies: {
      title: 'Case Studies - Brian Bureson',
      description: 'Explore detailed case studies of Brian Bureson\'s product design work, featuring UX research, design systems, and user-centered solutions.',
      keywords: 'case studies, UX case studies, product design portfolio, design projects',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      twitterCard: 'summary_large_image',
      twitterTitle: '',
      twitterDescription: '',
      twitterImage: '',
      canonicalUrl: '',
    },
    contact: {
      title: 'Contact - Brian Bureson',
      description: 'Get in touch with Brian Bureson for design collaboration, consulting, or speaking opportunities.',
      keywords: 'contact Brian Bureson, design collaboration, UX consulting',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      twitterCard: 'summary_large_image',
      twitterTitle: '',
      twitterDescription: '',
      twitterImage: '',
      canonicalUrl: '',
    },
  },
  caseStudyDefaults: {
    title: '[Case Study Title] - Brian Bureson',
    description: 'A detailed case study showcasing the design process, user research, and outcomes.',
    keywords: 'UX case study, product design, user research',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterCard: 'summary_large_image',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
    canonicalUrl: '',
  },
};

const SEO_STORAGE_KEY = 'portfolio-seo-data';

export function getSEOData(): AllSEOData {
  try {
    const stored = localStorage.getItem(SEO_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all fields exist
      const merged = {
        sitewide: { 
          ...DEFAULT_SEO_DATA.sitewide, 
          ...parsed.sitewide,
          // Ensure siteUrl is always current (in case domain changed)
          siteUrl: parsed.sitewide?.siteUrl || DEFAULT_SEO_DATA.sitewide.siteUrl,
          // Ensure defaultOGImage always has a fallback
          defaultOGImage: parsed.sitewide?.defaultOGImage || DEFAULT_SEO_DATA.sitewide.defaultOGImage,
        },
        pages: {
          home: { ...DEFAULT_SEO_DATA.pages.home, ...parsed.pages?.home },
          about: { ...DEFAULT_SEO_DATA.pages.about, ...parsed.pages?.about },
          caseStudies: { ...DEFAULT_SEO_DATA.pages.caseStudies, ...parsed.pages?.caseStudies },
          contact: { ...DEFAULT_SEO_DATA.pages.contact, ...parsed.pages?.contact },
        },
        caseStudyDefaults: { ...DEFAULT_SEO_DATA.caseStudyDefaults, ...parsed.caseStudyDefaults },
      };
      
      // Ensure defaultOGImage has a fallback if empty
      if (!merged.sitewide.defaultOGImage || merged.sitewide.defaultOGImage.trim() === '') {
        merged.sitewide.defaultOGImage = `${merged.sitewide.siteUrl}/api/og?title=${encodeURIComponent(merged.sitewide.siteName)}`;
      }
      
      return merged;
    }
  } catch (error) {
    console.error('Error loading SEO data:', error);
  }
  
  // Always return defaults with valid OG image fallback
  const defaults = { ...DEFAULT_SEO_DATA };
  if (!defaults.sitewide.defaultOGImage || defaults.sitewide.defaultOGImage.trim() === '') {
    defaults.sitewide.defaultOGImage = `${defaults.sitewide.siteUrl}/api/og?title=${encodeURIComponent(defaults.sitewide.siteName)}`;
  }
  
  return defaults;
}

export function saveSEOData(data: AllSEOData): void {
  try {
    localStorage.setItem(SEO_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving SEO data:', error);
  }
}

export function getCaseStudySEO(caseStudyId: string, caseStudyTitle?: string): SEOData {
  try {
    const stored = localStorage.getItem(`seo-case-study-${caseStudyId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading case study SEO:', error);
  }
  
  const defaults = getSEOData().caseStudyDefaults;
  return {
    ...defaults,
    title: caseStudyTitle ? `${caseStudyTitle} - Brian Bureson` : defaults.title,
  };
}

export function saveCaseStudySEO(caseStudyId: string, data: SEOData): void {
  try {
    localStorage.setItem(`seo-case-study-${caseStudyId}`, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving case study SEO:', error);
  }
}

// Apply SEO data to document head
export function applyPageSEO(pageSEO: SEOData, sitewide: SitewideSEO): void {
  // Update title
  document.title = pageSEO.title;

  // Helper to update or create meta tag
  const updateMetaTag = (selector: string, content: string) => {
    if (!content) return;
    
    let element = document.querySelector(selector);
    if (!element) {
      element = document.createElement('meta');
      const parts = selector.match(/\[(.+?)="(.+?)"\]/);
      if (parts) {
        element.setAttribute(parts[1], parts[2]);
      }
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // Standard meta tags
  updateMetaTag('meta[name="description"]', pageSEO.description);
  updateMetaTag('meta[name="keywords"]', pageSEO.keywords);
  updateMetaTag('meta[name="author"]', sitewide.defaultAuthor);
  
  // Meta robots (default: index, follow)
  updateMetaTag('meta[name="robots"]', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

  // Open Graph tags
  updateMetaTag('meta[property="og:site_name"]', sitewide.siteName);
  updateMetaTag('meta[property="og:title"]', pageSEO.ogTitle || pageSEO.title);
  updateMetaTag('meta[property="og:description"]', pageSEO.ogDescription || pageSEO.description);
  updateMetaTag('meta[property="og:type"]', 'website');
  updateMetaTag('meta[property="og:locale"]', 'en_US');
  
  // OG URL - use canonical URL if available, otherwise construct from site URL
  const ogUrl = pageSEO.canonicalUrl || (pageSEO.canonicalUrl === '' ? undefined : `${sitewide.siteUrl}${window.location.pathname}`);
  if (ogUrl && !ogUrl.includes('#')) {
    updateMetaTag('meta[property="og:url"]', ogUrl);
  } else if (!pageSEO.canonicalUrl) {
    // Fallback: construct URL from current pathname (without hash)
    const currentUrl = `${sitewide.siteUrl}${window.location.pathname}`;
    updateMetaTag('meta[property="og:url"]', currentUrl);
  }
  
  // OG Image - always provide a fallback using the OG API
  let ogImage = pageSEO.ogImage || sitewide.defaultOGImage;
  if (!ogImage || ogImage.trim() === '') {
    // Fallback: use OG image API
    ogImage = `${sitewide.siteUrl}/api/og?title=${encodeURIComponent(pageSEO.ogTitle || pageSEO.title)}`;
  }
  
  // Always set OG image (required for proper social sharing)
  updateMetaTag('meta[property="og:image"]', ogImage);
  // Standard OG image dimensions (1200x630 for social sharing)
  updateMetaTag('meta[property="og:image:width"]', '1200');
  updateMetaTag('meta[property="og:image:height"]', '630');
  updateMetaTag('meta[property="og:image:type"]', 'image/png');
  updateMetaTag('meta[property="og:image:alt"]', pageSEO.ogTitle || pageSEO.title);

  // Twitter Card tags - Twitter requires these to be present
  const twitterCard = pageSEO.twitterCard || sitewide.defaultTwitterCard || 'summary_large_image';
  const twitterTitle = pageSEO.twitterTitle || pageSEO.ogTitle || pageSEO.title;
  const twitterDescription = pageSEO.twitterDescription || pageSEO.ogDescription || pageSEO.description;
  
  // Use the same image as OG (already has fallback)
  const twitterImage = pageSEO.twitterImage || ogImage;
  
  updateMetaTag('meta[name="twitter:card"]', twitterCard);
  updateMetaTag('meta[name="twitter:title"]', twitterTitle);
  updateMetaTag('meta[name="twitter:description"]', twitterDescription);
  
  // Twitter requires an image for summary_large_image cards - always provide one
  updateMetaTag('meta[name="twitter:image"]', twitterImage);
  updateMetaTag('meta[name="twitter:image:alt"]', twitterTitle);

  // Canonical URL - only set if explicitly provided (non-empty)
  // Users can set this manually in SEO settings for each page
  // IMPORTANT: Canonical URLs should NEVER include hash fragments (#)
  if (pageSEO.canonicalUrl && pageSEO.canonicalUrl.trim() !== '') {
    // Strip hash fragments from canonical URL (canonical URLs should never have #)
    let cleanCanonicalUrl = pageSEO.canonicalUrl.trim();
    const originalUrl = cleanCanonicalUrl;
    const hashIndex = cleanCanonicalUrl.indexOf('#');
    if (hashIndex !== -1) {
      cleanCanonicalUrl = cleanCanonicalUrl.substring(0, hashIndex);
      console.warn('🔍 SEO: Stripped hash fragment from canonical URL:', originalUrl, '→', cleanCanonicalUrl);
    }
    
    // Also strip any query parameters that might have been accidentally included
    const queryIndex = cleanCanonicalUrl.indexOf('?');
    if (queryIndex !== -1) {
      cleanCanonicalUrl = cleanCanonicalUrl.substring(0, queryIndex);
    }
    
    // Ensure it's a valid URL (starts with http:// or https://)
    if (cleanCanonicalUrl && (cleanCanonicalUrl.startsWith('http://') || cleanCanonicalUrl.startsWith('https://'))) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = cleanCanonicalUrl;
      console.log('✅ SEO: Set canonical URL:', cleanCanonicalUrl);
    } else {
      console.warn('⚠️ SEO: Invalid canonical URL format (must start with http:// or https://):', cleanCanonicalUrl);
    }
  } else {
    // Remove canonical URL if it exists but shouldn't be set
    const existingLink = document.querySelector('link[rel="canonical"]');
    if (existingLink) {
      existingLink.remove();
      console.log('🗑️ SEO: Removed canonical URL (not set in SEO settings)');
    }
  }

  // Update favicon
  updateFavicon(sitewide);
}

// Function to update favicon dynamically
export function updateFavicon(sitewide: SitewideSEO): void {
  const faviconType = sitewide.faviconType || 'text';
  
  let mainFaviconUrl: string;
  let appleTouchIconUrl: string;
  let faviconMimeType: string = 'image/svg+xml';

  if (faviconType === 'image' && sitewide.faviconImageUrl) {
    // Use custom uploaded image
    mainFaviconUrl = sitewide.faviconImageUrl;
    appleTouchIconUrl = sitewide.faviconImageUrl;
    
    // Detect MIME type from data URI or default to PNG
    if (sitewide.faviconImageUrl.startsWith('data:image/png')) {
      faviconMimeType = 'image/png';
    } else if (sitewide.faviconImageUrl.startsWith('data:image/jpeg')) {
      faviconMimeType = 'image/jpeg';
    } else if (sitewide.faviconImageUrl.startsWith('data:image/svg')) {
      faviconMimeType = 'image/svg+xml';
    } else if (sitewide.faviconImageUrl.startsWith('data:image/x-icon')) {
      faviconMimeType = 'image/x-icon';
    } else {
      faviconMimeType = 'image/png';
    }
  } else {
    // Generate text-based SVG favicon
    const text = (sitewide.faviconText || 'BB').toString();
    const gradientStart = (sitewide.faviconGradientStart || '#8b5cf6').toString();
    const gradientEnd = (sitewide.faviconGradientEnd || '#3b82f6').toString();

    // Create SVG favicon with defensive encoding
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:${gradientStart};stop-opacity:1' /><stop offset='100%' style='stop-color:${gradientEnd};stop-opacity:1' /></linearGradient></defs><rect width='100' height='100' rx='20' fill='url(#grad)'/><text x='50' y='50' dominant-baseline='central' text-anchor='middle' font-family='Arial, sans-serif' font-size='45' font-weight='bold' fill='white'>${text}</text></svg>`;
    
    const encoded = encodeURIComponent(svg);
    mainFaviconUrl = `data:image/svg+xml,${encoded}`;

    // Create Apple Touch Icon
    const appleSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'><defs><linearGradient id='grad2' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:${gradientStart};stop-opacity:1' /><stop offset='100%' style='stop-color:${gradientEnd};stop-opacity:1' /></linearGradient></defs><rect width='180' height='180' rx='40' fill='url(#grad2)'/><text x='90' y='90' dominant-baseline='central' text-anchor='middle' font-family='Arial, sans-serif' font-size='80' font-weight='bold' fill='white'>${text}</text></svg>`;
    const appleEncoded = encodeURIComponent(appleSvg);
    appleTouchIconUrl = `data:image/svg+xml,${appleEncoded}`;
  }

  // Update main favicon
  let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    document.head.appendChild(favicon);
  }
  favicon.type = faviconMimeType;
  favicon.href = mainFaviconUrl;

  // Update Apple Touch Icon
  let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
  if (!appleTouchIcon) {
    appleTouchIcon = document.createElement('link');
    appleTouchIcon.rel = 'apple-touch-icon';
    document.head.appendChild(appleTouchIcon);
  }
  appleTouchIcon.href = appleTouchIconUrl;
}

// Upload favicon to Supabase Storage
export async function uploadFaviconToSupabase(file: File): Promise<string | null> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'png';
    const fileName = `favicon-${timestamp}.${fileExtension}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('portfolio-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading favicon to Supabase:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('portfolio-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading favicon:', error);
    return null;
  }
}

// Get favicon from Supabase Storage
export async function getFaviconFromSupabase(): Promise<string | null> {
  try {
    // First, let's check if there are ANY records in app_settings
    console.log('🔍 Checking for ANY records in app_settings...');
    const { data: allRecords, error: allRecordsError } = await supabase
      .from('app_settings')
      .select('*')
      .limit(5);
    
    console.log('🔍 All app_settings records:', { allRecords, allRecordsError });
    
    // First try to get any favicon (most permissive query) - works for public access
    console.log('🔍 Checking for any favicon (public access)...');
    const { data: anySettings, error: anyError } = await supabase
      .from('app_settings')
      .select('favicon_url, is_public')
      .not('favicon_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log('🔍 Any favicon query result:', { anySettings, anyError });

    if (!anyError && anySettings?.favicon_url) {
      console.log('✅ Using favicon:', anySettings.favicon_url, 'is_public:', anySettings.is_public);
      return anySettings.favicon_url;
    } else {
      console.log('❌ No favicon found:', { anyError, anySettings });
    console.log('🔍 Debug - anySettings details:', {
      data: anySettings,
      hasData: !!anySettings,
      hasFaviconUrl: !!anySettings?.favicon_url,
      faviconUrl: anySettings?.favicon_url,
      isPublic: anySettings?.is_public,
      fullObject: JSON.stringify(anySettings, null, 2)
    });
    }

    // Try to get public favicon as fallback (more restrictive query)
    console.log('🔍 Checking for public favicon as fallback...');
    const { data: publicSettings, error: publicError } = await supabase
      .from('app_settings')
      .select('favicon_url')
      .eq('is_public', true)
      .maybeSingle();

    console.log('🔍 Public favicon query result:', { publicSettings, publicError });

    if (!publicError && publicSettings?.favicon_url) {
      console.log('✅ Using public favicon:', publicSettings.favicon_url);
      return publicSettings.favicon_url;
    } else {
      console.log('❌ No public favicon found:', { publicError, publicSettings });
    }

    return null;
  } catch (error) {
    console.error('Error getting favicon from Supabase:', error);
    return null;
  }
}

// Save favicon URL to Supabase database
export async function saveFaviconToSupabase(faviconUrl: string): Promise<boolean> {
  try {
    // Check for both Supabase auth and bypass auth
    const { data: { user } } = await supabase.auth.getUser();
    const isBypassAuth = localStorage.getItem('isAuthenticated') === 'true';
    
    // Debug authentication state
    if (!user && !isBypassAuth) {
      console.log('🔍 No authentication found - user:', user, 'bypass:', isBypassAuth);
    } else {
      console.log('🔍 Authentication found - user:', user?.id, 'bypass:', isBypassAuth);
    }
    
    if (!user && !isBypassAuth) {
      console.error('No authenticated user found (neither Supabase auth nor bypass auth)');
      return false;
    }

    // Use user ID or fallback for bypass auth
    const userId = user?.id || '7cd2752f-93c5-46e6-8535-32769fb10055'; // Fallback for bypass auth
    console.log('Saving favicon for user:', userId, 'Auth type:', user ? 'Supabase' : 'Bypass');

    // Update or create app settings with favicon URL for user and mark as public
    const { data: userData, error: userError } = await supabase
      .from('app_settings')
      .upsert({
        user_id: userId,
        favicon_url: faviconUrl,
        theme: 'dark',
        is_authenticated: true,
        show_debug_panel: false,
        is_public: true  // Mark as public immediately
      }, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      });

    if (userError) {
      console.error('Error saving user favicon to Supabase:', userError);
      return false;
    }

    console.log('✅ Favicon saved successfully for user and marked as public:', { userData });
    console.log('🔍 Saved favicon details:', {
      userId,
      faviconUrl,
      isPublic: true,
      userData
    });
    return true;
  } catch (error) {
    console.error('Error saving favicon to Supabase:', error);
    return false;
  }
}
