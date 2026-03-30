// SEO Manager - Manages SEO metadata for all pages
import { supabase } from '../lib/supabaseClient';
import { getPortfolioOwnerUserId } from '../lib/portfolioOwner';

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
      description: 'Learn more about Brian Bureson, a Denver-based product design leader with a passion for creating meaningful user experiences and leading design teams.',
      keywords: 'about Brian Bureson, Denver product designer, design leader, UX designer, product designer',
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
const CASE_STUDY_SEO_PREFIX = 'case-study:';

type SeoDataRow = {
  id: string;
  user_id?: string | null;
  page_type: string;
  title?: string | null;
  description?: string | null;
  keywords?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
  twitter_card?: string | null;
  twitter_title?: string | null;
  twitter_description?: string | null;
  twitter_image?: string | null;
  canonical_url?: string | null;
  site_name?: string | null;
  site_url?: string | null;
  default_author?: string | null;
  default_og_image?: string | null;
  default_twitter_card?: string | null;
  favicon_type?: string | null;
  favicon_text?: string | null;
  favicon_gradient_start?: string | null;
  favicon_gradient_end?: string | null;
  favicon_image?: string | null;
};

const cloneDefaults = (): AllSEOData => ({
  sitewide: { ...DEFAULT_SEO_DATA.sitewide },
  pages: {
    home: { ...DEFAULT_SEO_DATA.pages.home },
    about: { ...DEFAULT_SEO_DATA.pages.about },
    caseStudies: { ...DEFAULT_SEO_DATA.pages.caseStudies },
    contact: { ...DEFAULT_SEO_DATA.pages.contact },
  },
  caseStudyDefaults: { ...DEFAULT_SEO_DATA.caseStudyDefaults },
});

const withSafeOgFallback = (data: AllSEOData): AllSEOData => {
  const merged = {
    ...data,
    sitewide: { ...data.sitewide },
    pages: {
      home: { ...data.pages.home },
      about: { ...data.pages.about },
      caseStudies: { ...data.pages.caseStudies },
      contact: { ...data.pages.contact },
    },
    caseStudyDefaults: { ...data.caseStudyDefaults },
  };
  if (!merged.sitewide.defaultOGImage || merged.sitewide.defaultOGImage.trim() === '') {
    merged.sitewide.defaultOGImage = `${merged.sitewide.siteUrl}/api/og?title=${encodeURIComponent(merged.sitewide.siteName)}`;
  }
  return merged;
};

const mapSeoRowToSeoData = (row: SeoDataRow, fallback: SEOData): SEOData => ({
  ...fallback,
  title: row.title ?? fallback.title,
  description: row.description ?? fallback.description,
  keywords: row.keywords ?? fallback.keywords,
  ogTitle: row.og_title ?? fallback.ogTitle,
  ogDescription: row.og_description ?? fallback.ogDescription,
  ogImage: row.og_image ?? fallback.ogImage,
  twitterCard: (row.twitter_card as SEOData['twitterCard']) ?? fallback.twitterCard,
  twitterTitle: row.twitter_title ?? fallback.twitterTitle,
  twitterDescription: row.twitter_description ?? fallback.twitterDescription,
  twitterImage: row.twitter_image ?? fallback.twitterImage,
  canonicalUrl: row.canonical_url ?? fallback.canonicalUrl,
});

function mergeSEODataFromRows(rows: SeoDataRow[], base?: AllSEOData): AllSEOData {
  const merged = base
    ? withSafeOgFallback(base)
    : withSafeOgFallback(cloneDefaults());

  for (const row of rows) {
    const key = (row.page_type || '').trim();
    if (!key) continue;

    if (key === 'sitewide') {
      merged.sitewide = {
        ...merged.sitewide,
        siteName: row.site_name ?? merged.sitewide.siteName,
        siteUrl: row.site_url ?? merged.sitewide.siteUrl,
        defaultAuthor: row.default_author ?? merged.sitewide.defaultAuthor,
        defaultOGImage: row.default_og_image ?? merged.sitewide.defaultOGImage,
        defaultTwitterCard:
          (row.default_twitter_card as SitewideSEO['defaultTwitterCard']) ??
          merged.sitewide.defaultTwitterCard,
        faviconType: (row.favicon_type as SitewideSEO['faviconType']) ?? merged.sitewide.faviconType,
        faviconText: row.favicon_text ?? merged.sitewide.faviconText,
        faviconGradientStart: row.favicon_gradient_start ?? merged.sitewide.faviconGradientStart,
        faviconGradientEnd: row.favicon_gradient_end ?? merged.sitewide.faviconGradientEnd,
        faviconImageUrl: row.favicon_image ?? merged.sitewide.faviconImageUrl,
      };
      continue;
    }

    if (key === 'home' || key === 'about' || key === 'caseStudies' || key === 'contact') {
      merged.pages[key] = mapSeoRowToSeoData(row, merged.pages[key]);
      continue;
    }

    if (key === 'caseStudyDefaults' || key === 'case-study-defaults' || key === 'case_study_defaults') {
      merged.caseStudyDefaults = mapSeoRowToSeoData(row, merged.caseStudyDefaults);
    }
  }

  return withSafeOgFallback(merged);
}

export function getSEOData(): AllSEOData {
  try {
    const stored = localStorage.getItem(SEO_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const base = cloneDefaults();
      const merged = {
        ...base,
        sitewide: {
          ...base.sitewide,
          ...parsed.sitewide,
          siteUrl: parsed.sitewide?.siteUrl || base.sitewide.siteUrl,
          defaultOGImage: parsed.sitewide?.defaultOGImage || base.sitewide.defaultOGImage,
        },
        pages: {
          home: { ...base.pages.home, ...parsed.pages?.home },
          about: { ...base.pages.about, ...parsed.pages?.about },
          caseStudies: { ...base.pages.caseStudies, ...parsed.pages?.caseStudies },
          contact: { ...base.pages.contact, ...parsed.pages?.contact },
        },
        caseStudyDefaults: { ...base.caseStudyDefaults, ...parsed.caseStudyDefaults },
      };
      return withSafeOgFallback(merged);
    }
  } catch (error) {
    console.error('Error loading SEO data:', error);
  }
  
  return withSafeOgFallback(cloneDefaults());
}

async function fetchSeoRowsForOwner(ownerId: string): Promise<SeoDataRow[]> {
  const { data, error } = await supabase
    .from('seo_data')
    .select('*')
    .eq('user_id', ownerId);

  if (error) {
    throw error;
  }
  return (data || []) as SeoDataRow[];
}

export async function loadSEODataFromSupabase(): Promise<AllSEOData> {
  const local = getSEOData();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const ownerId = getPortfolioOwnerUserId(user?.id);
    const rows = await fetchSeoRowsForOwner(ownerId);
    const merged = mergeSEODataFromRows(rows, local);
    localStorage.setItem(SEO_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (error) {
    console.warn('⚠️ SEO: Falling back to local SEO data (Supabase unavailable):', error);
    return local;
  }
}

export async function saveSEOData(data: AllSEOData): Promise<void> {
  try {
    localStorage.setItem(SEO_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving SEO data:', error);
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      throw new Error('Sign in with Supabase to save SEO settings.');
    }
    const ownerId = getPortfolioOwnerUserId(user.id);
    const existingRows = await fetchSeoRowsForOwner(ownerId);
    const existingByType = new Map(existingRows.map((row) => [row.page_type, row]));

    const payloads: Array<{ pageType: string; payload: Record<string, unknown> }> = [
      {
        pageType: 'sitewide',
        payload: {
          site_name: data.sitewide.siteName,
          site_url: data.sitewide.siteUrl,
          default_author: data.sitewide.defaultAuthor,
          default_og_image: data.sitewide.defaultOGImage,
          default_twitter_card: data.sitewide.defaultTwitterCard,
          favicon_type: data.sitewide.faviconType || 'text',
          favicon_text: data.sitewide.faviconText || 'BB',
          favicon_gradient_start: data.sitewide.faviconGradientStart || '#8b5cf6',
          favicon_gradient_end: data.sitewide.faviconGradientEnd || '#3b82f6',
          favicon_image: data.sitewide.faviconImageUrl || null,
        },
      },
      { pageType: 'home', payload: toSeoRowPayload(data.pages.home) },
      { pageType: 'about', payload: toSeoRowPayload(data.pages.about) },
      { pageType: 'caseStudies', payload: toSeoRowPayload(data.pages.caseStudies) },
      { pageType: 'contact', payload: toSeoRowPayload(data.pages.contact) },
      { pageType: 'caseStudyDefaults', payload: toSeoRowPayload(data.caseStudyDefaults) },
    ];

    for (const { pageType, payload } of payloads) {
      const existing = existingByType.get(pageType);
      if (existing?.id) {
        const { error } = await supabase
          .from('seo_data')
          .update(payload)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('seo_data')
          .insert({
            user_id: ownerId,
            page_type: pageType,
            ...payload,
          });
        if (error) throw error;
      }
    }
  } catch (error) {
    console.error('Error saving SEO data to Supabase:', error);
    throw error;
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

function toSeoRowPayload(seo: SEOData): Record<string, unknown> {
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    og_title: seo.ogTitle || null,
    og_description: seo.ogDescription || null,
    og_image: seo.ogImage || null,
    twitter_card: seo.twitterCard || null,
    twitter_title: seo.twitterTitle || null,
    twitter_description: seo.twitterDescription || null,
    twitter_image: seo.twitterImage || null,
    canonical_url: seo.canonicalUrl || null,
  };
}

export async function loadCaseStudySEOFromSupabase(
  caseStudyId: string,
  caseStudyTitle?: string
): Promise<SEOData> {
  const local = getCaseStudySEO(caseStudyId, caseStudyTitle);
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const ownerId = getPortfolioOwnerUserId(user?.id);
    const pageType = `${CASE_STUDY_SEO_PREFIX}${caseStudyId}`;
    const { data, error } = await supabase
      .from('seo_data')
      .select('*')
      .eq('user_id', ownerId)
      .eq('page_type', pageType)
      .maybeSingle();
    if (error) throw error;
    if (!data) return local;
    const merged = mapSeoRowToSeoData(data as SeoDataRow, local);
    localStorage.setItem(`seo-case-study-${caseStudyId}`, JSON.stringify(merged));
    return merged;
  } catch (error) {
    console.warn('⚠️ SEO: Falling back to local case study SEO:', error);
    return local;
  }
}

export async function saveCaseStudySEO(caseStudyId: string, data: SEOData): Promise<void> {
  try {
    localStorage.setItem(`seo-case-study-${caseStudyId}`, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving case study SEO:', error);
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      throw new Error('Sign in with Supabase to save case study SEO.');
    }
    const ownerId = getPortfolioOwnerUserId(user.id);
    const pageType = `${CASE_STUDY_SEO_PREFIX}${caseStudyId}`;
    const payload = toSeoRowPayload(data);
    const { data: existing, error: findErr } = await supabase
      .from('seo_data')
      .select('id')
      .eq('user_id', ownerId)
      .eq('page_type', pageType)
      .maybeSingle();
    if (findErr) throw findErr;

    if (existing?.id) {
      const { error } = await supabase
        .from('seo_data')
        .update(payload)
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('seo_data')
        .insert({
          user_id: ownerId,
          page_type: pageType,
          ...payload,
        });
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error saving case study SEO to Supabase:', error);
    throw error;
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
  
  const normalizeCanonicalUrl = (urlValue: string): string => {
    const trimmed = urlValue.trim();
    const hashIndex = trimmed.indexOf('#');
    const withoutHash = hashIndex === -1 ? trimmed : trimmed.substring(0, hashIndex);
    const queryIndex = withoutHash.indexOf('?');
    return queryIndex === -1 ? withoutHash : withoutHash.substring(0, queryIndex);
  };

  // Always resolve a canonical URL so crawlers consistently understand the preferred URL.
  const configuredCanonical = pageSEO.canonicalUrl?.trim()
    ? normalizeCanonicalUrl(pageSEO.canonicalUrl)
    : '';
  const computedCanonical = `${sitewide.siteUrl}${window.location.pathname}`;
  const effectiveCanonical = configuredCanonical || computedCanonical;

  // OG URL should match the canonical URL whenever possible.
  updateMetaTag('meta[property="og:url"]', effectiveCanonical);
  
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

  // Canonical URL should always be present.
  if (effectiveCanonical.startsWith('http://') || effectiveCanonical.startsWith('https://')) {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = effectiveCanonical;
    console.log('✅ SEO: Set canonical URL:', effectiveCanonical);
  } else {
    console.warn('⚠️ SEO: Could not set canonical URL due to invalid format:', effectiveCanonical);
  }

  // Favicon is applied once in App.tsx (Supabase + localStorage fallback), not here — applying it
  // from page SEO would overwrite the server-resolved favicon on every route.
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
    // Optional: set in Vercel (Preview/Production) to the same public Storage URL as in app_settings
    // if you need the icon before DB migrations run, or as a fixed override.
    const fromEnv = import.meta.env.VITE_PUBLIC_FAVICON_URL;
    if (typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
      return fromEnv.trim();
    }

    const { data: { user } } = await supabase.auth.getUser();
    const ownerId = getPortfolioOwnerUserId(user?.id);
    const { data: ownerSettings, error: ownerErr } = await supabase
      .from('app_settings')
      .select('favicon_url')
      .eq('user_id', ownerId)
      .not('favicon_url', 'is', null)
      .maybeSingle();

    if (!ownerErr && ownerSettings?.favicon_url) {
      console.log('✅ Using favicon from app_settings (portfolio owner row)');
      return ownerSettings.favicon_url;
    }

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

    const { data: seoRow, error: seoErr } = await supabase
      .from('seo_data')
      .select('favicon_image')
      .not('favicon_image', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!seoErr && seoRow?.favicon_image) {
      console.log('✅ Using favicon from seo_data (fallback)');
      return seoRow.favicon_image;
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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      console.error('Sign in with Supabase to save favicon');
      return false;
    }

    const userId = getPortfolioOwnerUserId(user.id);

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
