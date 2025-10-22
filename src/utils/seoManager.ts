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
    music: SEOData;
    visuals: SEOData;
  };
  caseStudyDefaults: SEOData; // Template for individual case studies
}

const DEFAULT_SEO_DATA: AllSEOData = {
  sitewide: {
    siteName: 'Brian Bureson - Product Design Leader',
    siteUrl: 'https://brianbureson.com',
    defaultAuthor: 'Brian Bureson',
    defaultOGImage: '',
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
    music: {
      title: 'Music - Brian Bureson',
      description: 'Discover Brian Bureson\'s musical creations and audio projects.',
      keywords: 'Brian Bureson music, audio projects, creative work',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      twitterCard: 'summary_large_image',
      twitterTitle: '',
      twitterDescription: '',
      twitterImage: '',
      canonicalUrl: '',
    },
    visuals: {
      title: 'Visuals - Brian Bureson',
      description: 'Browse Brian Bureson\'s visual design work, illustrations, and creative projects.',
      keywords: 'visual design, illustrations, creative work, design portfolio',
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
      return {
        sitewide: { ...DEFAULT_SEO_DATA.sitewide, ...parsed.sitewide },
        pages: {
          home: { ...DEFAULT_SEO_DATA.pages.home, ...parsed.pages?.home },
          about: { ...DEFAULT_SEO_DATA.pages.about, ...parsed.pages?.about },
          caseStudies: { ...DEFAULT_SEO_DATA.pages.caseStudies, ...parsed.pages?.caseStudies },
          contact: { ...DEFAULT_SEO_DATA.pages.contact, ...parsed.pages?.contact },
          music: { ...DEFAULT_SEO_DATA.pages.music, ...parsed.pages?.music },
          visuals: { ...DEFAULT_SEO_DATA.pages.visuals, ...parsed.pages?.visuals },
        },
        caseStudyDefaults: { ...DEFAULT_SEO_DATA.caseStudyDefaults, ...parsed.caseStudyDefaults },
      };
    }
  } catch (error) {
    console.error('Error loading SEO data:', error);
  }
  return DEFAULT_SEO_DATA;
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

  // Open Graph tags
  updateMetaTag('meta[property="og:site_name"]', sitewide.siteName);
  updateMetaTag('meta[property="og:title"]', pageSEO.ogTitle || pageSEO.title);
  updateMetaTag('meta[property="og:description"]', pageSEO.ogDescription || pageSEO.description);
  updateMetaTag('meta[property="og:type"]', 'website');
  
  const ogImage = pageSEO.ogImage || sitewide.defaultOGImage;
  if (ogImage) {
    updateMetaTag('meta[property="og:image"]', ogImage);
  }

  // Twitter Card tags
  updateMetaTag('meta[name="twitter:card"]', pageSEO.twitterCard || sitewide.defaultTwitterCard);
  updateMetaTag('meta[name="twitter:title"]', pageSEO.twitterTitle || pageSEO.ogTitle || pageSEO.title);
  updateMetaTag('meta[name="twitter:description"]', pageSEO.twitterDescription || pageSEO.ogDescription || pageSEO.description);
  
  const twitterImage = pageSEO.twitterImage || pageSEO.ogImage || sitewide.defaultOGImage;
  if (twitterImage) {
    updateMetaTag('meta[name="twitter:image"]', twitterImage);
  }

  // Canonical URL
  if (pageSEO.canonicalUrl) {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = pageSEO.canonicalUrl;
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
    const text = sitewide.faviconText || 'BB';
    const gradientStart = sitewide.faviconGradientStart || '#8b5cf6';
    const gradientEnd = sitewide.faviconGradientEnd || '#3b82f6';

    // Create SVG favicon
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
    // First try to get public favicon (no auth required)
    const { data: publicSettings, error: publicError } = await supabase
      .from('app_settings')
      .select('favicon_url')
      .eq('user_id', 'public')
      .maybeSingle();

    if (!publicError && publicSettings?.favicon_url) {
      console.log('Using public favicon:', publicSettings.favicon_url);
      return publicSettings.favicon_url;
    }

    // If no public favicon, try user-specific favicon
    const { data: { user } } = await supabase.auth.getUser();
    const isBypassAuth = localStorage.getItem('isAuthenticated') === 'true';
    
    if (!user && !isBypassAuth) {
      console.log('No authenticated user found for favicon (neither Supabase auth nor bypass auth)');
      return null;
    }

    // Use user ID or fallback for bypass auth
    const userId = user?.id || '7cd2752f-93c5-46e6-8535-32769fb10055'; // Fallback for bypass auth
    console.log('Getting favicon for user:', userId, 'Auth type:', user ? 'Supabase' : 'Bypass');

    // Get app settings with favicon for current user
    const { data: settings, error } = await supabase
      .from('app_settings')
      .select('favicon_url')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully

    if (error) {
      console.error('Error fetching favicon from database:', error);
      return null;
    }

    return settings?.favicon_url || null;
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

    // Update or create app settings with favicon URL for user
    const { data: userData, error: userError } = await supabase
      .from('app_settings')
      .upsert({
        user_id: userId,
        favicon_url: faviconUrl,
        theme: 'dark',
        is_authenticated: true,
        show_debug_panel: false
      }, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      });

    if (userError) {
      console.error('Error saving user favicon to Supabase:', userError);
      return false;
    }

    // Also save as public favicon for all visitors
    const { data: publicData, error: publicError } = await supabase
      .from('app_settings')
      .upsert({
        user_id: 'public',
        favicon_url: faviconUrl,
        theme: 'dark',
        is_authenticated: false,
        show_debug_panel: false
      }, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      });

    if (publicError) {
      console.error('Error saving public favicon to Supabase:', publicError);
      return false;
    }

    console.log('Favicon saved successfully for both user and public:', { userData, publicData });
    return true;
  } catch (error) {
    console.error('Error saving favicon to Supabase:', error);
    return false;
  }
}
