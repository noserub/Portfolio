// Structured Data (JSON-LD) Generator for SEO
// Critical for LLM/AI search engines

import { SEOData, SitewideSEO } from './seoManager';

export interface PersonSchema {
  '@context': 'https://schema.org';
  '@type': 'Person';
  name: string;
  jobTitle?: string;
  description?: string;
  url?: string;
  image?: string;
  sameAs?: string[];
  email?: string;
  worksFor?: {
    '@type': 'Organization';
    name: string;
  };
}

export interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
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
    name: string;
    url?: string;
  };
  publisher: {
    '@type': 'Organization';
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
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: personData?.name || sitewide.defaultAuthor,
    jobTitle: personData?.jobTitle || 'Product Design Leader',
    description: personData?.description || `Portfolio of ${sitewide.defaultAuthor}, an experienced product design leader.`,
    url: sitewide.siteUrl,
    image: personData?.image || sitewide.defaultOGImage,
    email: personData?.email,
    sameAs: personData?.sameAs || [],
    worksFor: {
      '@type': 'Organization',
      name: sitewide.siteName,
    },
  };
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(sitewide: SitewideSEO): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: sitewide.siteName,
    url: sitewide.siteUrl,
    logo: sitewide.defaultOGImage,
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
  const schema: ArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: articleData?.headline || pageSEO.title,
    description: articleData?.description || pageSEO.description,
    author: {
      '@type': 'Person',
      name: sitewide.defaultAuthor,
      url: sitewide.siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: sitewide.siteName,
      logo: sitewide.defaultOGImage
        ? {
            '@type': 'ImageObject',
            url: sitewide.defaultOGImage,
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
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
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
  // Remove existing structured data script if it exists
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript) {
    existingScript.remove();
  }

  // Create new script tag with structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema, null, 2);
  script.id = 'structured-data';
  document.head.appendChild(script);
}

/**
 * Inject multiple structured data schemas
 */
export function injectMultipleStructuredData(schemas: object[]): void {
  // Remove all existing structured data scripts
  const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
  existingScripts.forEach((script) => script.remove());

  // Inject all schemas
  schemas.forEach((schema, index) => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema, null, 2);
    script.id = `structured-data-${index}`;
    document.head.appendChild(script);
  });
}

