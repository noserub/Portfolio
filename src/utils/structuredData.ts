// Structured Data (JSON-LD) Generator for SEO
// Critical for LLM/AI search engines

import { SEOData, SitewideSEO } from './seoManager';

/** Split newline/comma-separated sameAs text into valid http(s) URLs (deduped). */
export function parseSameAsRaw(raw?: string | null): string[] {
  if (!raw || !String(raw).trim()) return [];
  const parts = String(raw)
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));
  return [...new Set(parts)];
}

export function mergeSitewideSameAsUrls(sitewideRaw?: string | null, envRaw?: string): string[] {
  return [...new Set([...parseSameAsRaw(sitewideRaw), ...parseSameAsRaw(envRaw)])];
}

export function structuredDataEntityIds(siteUrl: string): {
  person: string;
  organization: string;
  website: string;
} {
  const base = siteUrl.replace(/\/+$/, '');
  return {
    person: `${base}/#person`,
    organization: `${base}/#organization`,
    website: `${base}/#website`,
  };
}

function organizationLogoUrl(sitewide: SitewideSEO): string | undefined {
  const dedicated = sitewide.organizationLogoUrl?.trim();
  if (dedicated) return dedicated;
  const og = sitewide.defaultOGImage?.trim();
  return og || undefined;
}

export interface PersonSchema {
  '@context': 'https://schema.org';
  '@type': 'Person';
  '@id'?: string;
  name: string;
  jobTitle?: string;
  description?: string;
  url?: string;
  image?: string;
  sameAs?: string[];
  email?: string;
  worksFor?: {
    '@type': 'Organization';
    '@id'?: string;
    name: string;
  };
}

export interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  '@id'?: string;
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[];
  description?: string;
}

export interface ArticleSchema {
  '@context': 'https://schema.org';
  '@type': 'Article';
  headline: string;
  description: string;
  author: {
    '@type': 'Person';
    '@id'?: string;
    name: string;
    url?: string;
  };
  publisher: {
    '@type': 'Organization';
    '@id'?: string;
    name: string;
    logo?: {
      '@type': 'ImageObject';
      url: string;
    };
  };
  image?: string | string[];
  datePublished?: string;
  dateModified?: string;
  url?: string;
  mainEntityOfPage?: {
    '@type': 'WebPage';
    '@id': string;
  };
}

export interface WebSiteSchema {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  '@id'?: string;
  name: string;
  url: string;
  description?: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: {
      '@type': 'EntryPoint';
      urlTemplate: string;
    };
    'query-input': string;
  };
}

export interface BreadcrumbListSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item?: string;
  }>;
}

/**
 * Generate Person schema for About page
 */
export function generatePersonSchema(
  sitewide: SitewideSEO,
  personData?: {
    name?: string;
    jobTitle?: string;
    description?: string;
    image?: string;
    email?: string;
    sameAs?: string[];
  }
): PersonSchema {
  const ids = structuredDataEntityIds(sitewide.siteUrl);
  const sameAsList = personData?.sameAs?.length
    ? [...new Set(personData.sameAs)]
    : mergeSitewideSameAsUrls(
        sitewide.sameAs,
        typeof import.meta !== 'undefined' && import.meta.env?.VITE_PUBLIC_SAME_AS
      );

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': ids.person,
    name: personData?.name || sitewide.defaultAuthor,
    jobTitle: personData?.jobTitle || 'Product Design Leader',
    description: personData?.description || `Portfolio of ${sitewide.defaultAuthor}, an experienced product design leader.`,
    url: sitewide.siteUrl,
    image: personData?.image || sitewide.defaultOGImage,
    email: personData?.email,
    ...(sameAsList.length > 0 ? { sameAs: sameAsList } : {}),
    worksFor: {
      '@type': 'Organization',
      '@id': ids.organization,
      name: sitewide.siteName,
    },
  };
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(sitewide: SitewideSEO): OrganizationSchema {
  const ids = structuredDataEntityIds(sitewide.siteUrl);
  const logo = organizationLogoUrl(sitewide);
  const sameAs = mergeSitewideSameAsUrls(
    sitewide.sameAs,
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_PUBLIC_SAME_AS
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ids.organization,
    name: sitewide.siteName,
    url: sitewide.siteUrl,
    ...(logo ? { logo } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    description: `Portfolio website of ${sitewide.defaultAuthor}, a product design leader.`,
  };
}

/**
 * Generate Article schema for case studies
 */
export function generateArticleSchema(
  pageSEO: SEOData,
  sitewide: SitewideSEO,
  articleData?: {
    headline?: string;
    description?: string;
    image?: string | string[];
    datePublished?: string;
    dateModified?: string;
    url?: string;
  }
): ArticleSchema {
  const ids = structuredDataEntityIds(sitewide.siteUrl);
  const pubLogo = organizationLogoUrl(sitewide);

  const schema: ArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: articleData?.headline || pageSEO.title,
    description: articleData?.description || pageSEO.description,
    author: {
      '@type': 'Person',
      '@id': ids.person,
      name: sitewide.defaultAuthor,
      url: sitewide.siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      '@id': ids.organization,
      name: sitewide.siteName,
      logo: pubLogo
        ? {
            '@type': 'ImageObject',
            url: pubLogo,
          }
        : undefined,
    },
  };

  if (articleData?.image) {
    schema.image = articleData.image;
  } else if (pageSEO.ogImage) {
    schema.image = pageSEO.ogImage;
  }

  if (articleData?.datePublished) {
    schema.datePublished = articleData.datePublished;
  }

  if (articleData?.dateModified) {
    schema.dateModified = articleData.dateModified;
  }

  if (articleData?.url || pageSEO.canonicalUrl) {
    schema.url = articleData?.url || pageSEO.canonicalUrl;
    schema.mainEntityOfPage = {
      '@type': 'WebPage',
      '@id': articleData?.url || pageSEO.canonicalUrl || '',
    };
  }

  return schema;
}

/**
 * Generate WebSite schema for home page
 */
export function generateWebSiteSchema(sitewide: SitewideSEO): WebSiteSchema {
  const ids = structuredDataEntityIds(sitewide.siteUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': ids.website,
    name: sitewide.siteName,
    url: sitewide.siteUrl,
    description: `Portfolio website of ${sitewide.defaultAuthor}, a product design leader.`,
  };
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbListSchema(
  items: Array<{ name: string; url: string }>,
  siteUrl: string
): BreadcrumbListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`,
    })),
  };
}

/**
 * Inject structured data into document head
 */
export function injectStructuredData(schema: object): void {
  // Remove only the single dynamic script injected by this helper.
  // Keep static build-time JSON-LD in place for crawlers.
  const existingScript = document.querySelector('script#structured-data-single[type="application/ld+json"]');
  if (existingScript) {
    existingScript.remove();
  }

  // Create new script tag with structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema, null, 2);
  script.id = 'structured-data-single';
  document.head.appendChild(script);
}

/**
 * Inject multiple structured data schemas
 */
export function injectMultipleStructuredData(schemas: object[]): void {
  if (!schemas || schemas.length === 0) {
    console.warn('⚠️ SEO: No structured data schemas to inject');
    return;
  }

  // Remove only dynamic schema scripts created by this function.
  // Do not delete static build-time JSON-LD.
  const existingScripts = document.querySelectorAll('script[type="application/ld+json"][id^="structured-data-dynamic-"]');
  existingScripts.forEach((script) => script.remove());

  // Inject all schemas
  schemas.forEach((schema, index) => {
    try {
      // Validate schema has required fields
      if (!schema || typeof schema !== 'object') {
        console.warn(`⚠️ SEO: Invalid schema at index ${index}`, schema);
        return;
      }

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      const jsonString = JSON.stringify(schema, null, 2);

      // Validate JSON is valid
      try {
        JSON.parse(jsonString);
      } catch (e) {
        console.error(`❌ SEO: Invalid JSON in schema at index ${index}:`, e);
        return;
      }

      script.textContent = jsonString;
      script.id = `structured-data-dynamic-${index}`;
      document.head.appendChild(script);

      console.log(`✅ SEO: Injected structured data schema ${index + 1}/${schemas.length}:`, (schema as any)['@type'] || 'Unknown');
    } catch (error) {
      console.error(`❌ SEO: Error injecting schema at index ${index}:`, error);
    }
  });

  console.log(`✅ SEO: Injected ${schemas.length} structured data schema(s)`);
}
