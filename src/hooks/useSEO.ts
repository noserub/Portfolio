import { useEffect } from 'react';
import {
  getSEOData,
  getCaseStudySEO,
  getWritingPostSEO,
  applyPageSEO,
  loadSEODataFromSupabase,
  loadCaseStudySEOFromSupabase,
  loadWritingPostSEOFromSupabase,
} from '../utils/seoManager';
import {
  generateWebSiteSchema,
  generateOrganizationSchema,
  generateBreadcrumbListSchema,
  generateArticleSchema,
  generatePersonSchema,
  injectMultipleStructuredData,
  mergeSitewideSameAsUrls,
} from '../utils/structuredData';
import { slugFromProjectTitle } from '../lib/projectSlug';

export function useSEO(pageKey: 'home' | 'about' | 'caseStudies' | 'contact') {
  useEffect(() => {
    let isCancelled = false;

    // Use setTimeout to ensure DOM is ready
    const applySEO = async () => {
      try {
        const seoData = await loadSEODataFromSupabase();
        if (isCancelled) return;
        const pageSEO = seoData.pages[pageKey];
        
        console.log(`🔍 SEO: Applying SEO for page: ${pageKey}`, { pageSEO, sitewide: seoData.sitewide });
        
        // Apply meta tags imperatively (no Helmet)
        if (pageSEO) {
          // Ensure sensible fallbacks for basic pages
          const withFallbacks = {
            ...pageSEO,
            ogTitle: pageSEO.ogTitle || pageSEO.title,
            ogDescription: pageSEO.ogDescription || pageSEO.description,
            twitterTitle: pageSEO.twitterTitle || pageSEO.title,
            twitterDescription: pageSEO.twitterDescription || pageSEO.description,
          } as typeof pageSEO;
          applyPageSEO(withFallbacks, seoData.sitewide);
        }

        // Inject structured data
        const schemas: Array<object> = [];
        
        // Always include Organization schema
        const orgSchema = generateOrganizationSchema(seoData.sitewide);
        schemas.push(orgSchema);
        
        // Add WebSite schema for home page
        if (pageKey === 'home') {
          const websiteSchema = generateWebSiteSchema(seoData.sitewide);
          schemas.push(websiteSchema);
        }
        
        // Add Person schema for About page
        if (pageKey === 'about') {
          const sameAs = mergeSitewideSameAsUrls(
            seoData.sitewide.sameAs,
            import.meta.env.VITE_PUBLIC_SAME_AS
          );
          const personSchema = generatePersonSchema(seoData.sitewide, {
            name: seoData.sitewide.defaultAuthor,
            jobTitle: 'Lead Principal UX · AI product design',
            description: pageSEO?.description,
            image: pageSEO?.ogImage || seoData.sitewide.defaultOGImage,
            sameAs: sameAs.length ? sameAs : undefined,
          });
          schemas.push(personSchema);
        }
        
        // Add breadcrumbs for all pages
        const breadcrumbs = [
          { name: 'Home', url: '/' },
        ];
        
        if (pageKey === 'about') {
          breadcrumbs.push({ name: 'About', url: '/about' });
        } else if (pageKey === 'contact') {
          breadcrumbs.push({ name: 'Contact', url: '/contact' });
        } else if (pageKey === 'caseStudies') {
          breadcrumbs.push({ name: 'Case Studies', url: '/#/case-studies' });
        }
        
        if (breadcrumbs.length > 1) {
          const breadcrumbSchema = generateBreadcrumbListSchema(breadcrumbs, seoData.sitewide.siteUrl);
          schemas.push(breadcrumbSchema);
        }
        
        console.log(`🔍 SEO: Generated ${schemas.length} structured data schema(s) for ${pageKey}`);
        injectMultipleStructuredData(schemas);
      } catch (error) {
        console.error('❌ SEO: Error applying SEO:', error);
      }
    };
    
    // Apply immediately and also after a short delay to ensure DOM is ready
    applySEO();
    const timeoutId = setTimeout(applySEO, 100);
    
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [pageKey]);
}

export type CaseStudySeoMeta = {
  createdAt?: string;
  updatedAt?: string;
  /** When false, skip applying case study meta (e.g. embedded design-system specimens). */
  enabled?: boolean;
};

// Hook specifically for case study detail pages
export function useCaseStudySEO(
  caseStudyId: string,
  caseStudyTitle?: string,
  meta?: CaseStudySeoMeta
) {
  useEffect(() => {
    if (meta?.enabled === false) return;

    let isCancelled = false;

    const applyCaseStudySEO = async () => {
      try {
        const seoData = await loadSEODataFromSupabase();
        if (isCancelled) return;
        const caseStudySEO = await loadCaseStudySEOFromSupabase(caseStudyId, caseStudyTitle);
        if (isCancelled) return;

        // Apply meta tags for case study page
        applyPageSEO(caseStudySEO, seoData.sitewide);

        // Inject structured data for case study
        const schemas: Array<object> = [];

        // Organization schema
        schemas.push(generateOrganizationSchema(seoData.sitewide));

        const slug = slugFromProjectTitle(caseStudyTitle || '');
        const articleUrl =
          caseStudySEO.canonicalUrl ||
          (slug ? `${seoData.sitewide.siteUrl}/project/${slug}` : undefined);

        const articleExtras: Parameters<typeof generateArticleSchema>[2] = {
          headline: caseStudyTitle || caseStudySEO.title,
          description: caseStudySEO.description,
          image: caseStudySEO.ogImage || caseStudySEO.twitterImage,
          url: articleUrl,
        };
        if (meta?.createdAt) {
          articleExtras.datePublished = meta.createdAt;
        }
        if (meta?.updatedAt) {
          articleExtras.dateModified = meta.updatedAt;
        }

        schemas.push(generateArticleSchema(caseStudySEO, seoData.sitewide, articleExtras));
        
        // Breadcrumbs
        const breadcrumbs = [
          { name: 'Home', url: '/' },
          {
            name: caseStudyTitle || 'Case Study',
            url: articleUrl || (slug ? `/project/${slug}` : '/'),
          },
        ];
        schemas.push(generateBreadcrumbListSchema(breadcrumbs, seoData.sitewide.siteUrl));
        
        injectMultipleStructuredData(schemas);
      } catch (error) {
        console.error('❌ SEO: Error applying case study SEO:', error);
        // Final fallback to local data for resilience
        const localSeoData = getSEOData();
        const localCaseStudySEO = getCaseStudySEO(caseStudyId, caseStudyTitle);
        applyPageSEO(localCaseStudySEO, localSeoData.sitewide);
      }
    };

    applyCaseStudySEO();

    return () => {
      isCancelled = true;
    };
  }, [caseStudyId, caseStudyTitle, meta?.createdAt, meta?.updatedAt, meta?.enabled]);
}

export function useWritingIndexSEO() {
  useEffect(() => {
    let isCancelled = false;

    const apply = async () => {
      try {
        const seoData = await loadSEODataFromSupabase();
        if (isCancelled) return;
        const pageSEO = seoData.pages.writingIndex;
        if (pageSEO) {
          const withFallbacks = {
            ...pageSEO,
            ogTitle: pageSEO.ogTitle || pageSEO.title,
            ogDescription: pageSEO.ogDescription || pageSEO.description,
            twitterTitle: pageSEO.twitterTitle || pageSEO.title,
            twitterDescription: pageSEO.twitterDescription || pageSEO.description,
          };
          applyPageSEO(withFallbacks, seoData.sitewide);
        }

        const schemas: object[] = [generateOrganizationSchema(seoData.sitewide)];
        schemas.push(
          generateBreadcrumbListSchema(
            [
              { name: 'Home', url: '/' },
              { name: 'Writing', url: '/writing' },
            ],
            seoData.sitewide.siteUrl,
          ),
        );
        injectMultipleStructuredData(schemas);
      } catch (error) {
        console.error('❌ SEO: Error applying writing index SEO:', error);
      }
    };

    apply();
    const timeoutId = setTimeout(apply, 100);
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);
}

export type WritingPostSeoMeta = {
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  slug?: string;
  excerpt?: string | null;
  heroImage?: string | null;
  topics?: string[];
};

export function useWritingPostSEO(
  postId: string,
  postTitle?: string,
  meta?: WritingPostSeoMeta,
) {
  useEffect(() => {
    let isCancelled = false;

    const source = {
      title: postTitle,
      excerpt: meta?.excerpt,
      heroImage: meta?.heroImage,
      topics: meta?.topics,
      slug: meta?.slug,
    };

    const applyWritingPostSEO = async () => {
      try {
        const seoData = await loadSEODataFromSupabase();
        if (isCancelled) return;
        const postSEO = await loadWritingPostSEOFromSupabase(postId, source);
        if (isCancelled) return;

        const datePublished = meta?.publishedAt || meta?.createdAt;
        const publishedTime = datePublished ? new Date(datePublished).toISOString() : undefined;
        const modifiedTime = meta?.updatedAt ? new Date(meta.updatedAt).toISOString() : undefined;

        applyPageSEO(postSEO, seoData.sitewide, {
          ogType: 'article',
          publishedTime,
          modifiedTime,
        });

        const schemas: object[] = [generateOrganizationSchema(seoData.sitewide)];
        const slug = meta?.slug || '';
        const articleUrl =
          postSEO.canonicalUrl ||
          (slug ? `${seoData.sitewide.siteUrl}/writing/${slug}` : undefined);

        const articleExtras: Parameters<typeof generateArticleSchema>[2] = {
          headline: postTitle || postSEO.title,
          description: postSEO.description,
          image: postSEO.ogImage || postSEO.twitterImage,
          url: articleUrl,
        };
        if (datePublished) articleExtras.datePublished = datePublished;
        if (meta?.updatedAt) articleExtras.dateModified = meta.updatedAt;

        schemas.push(generateArticleSchema(postSEO, seoData.sitewide, articleExtras));
        schemas.push(
          generateBreadcrumbListSchema(
            [
              { name: 'Home', url: '/' },
              { name: 'Writing', url: '/writing' },
              {
                name: postTitle || 'Post',
                url: articleUrl || (slug ? `/writing/${slug}` : '/writing'),
              },
            ],
            seoData.sitewide.siteUrl,
          ),
        );
        injectMultipleStructuredData(schemas);
      } catch (error) {
        console.error('❌ SEO: Error applying writing post SEO:', error);
        const localSeoData = getSEOData();
        const localPostSEO = getWritingPostSEO(postId, source);
        const datePublished = meta?.publishedAt || meta?.createdAt;
        applyPageSEO(localPostSEO, localSeoData.sitewide, {
          ogType: 'article',
          publishedTime: datePublished ? new Date(datePublished).toISOString() : undefined,
          modifiedTime: meta?.updatedAt ? new Date(meta.updatedAt).toISOString() : undefined,
        });
      }
    };

    applyWritingPostSEO();
    return () => {
      isCancelled = true;
    };
  }, [
    postId,
    postTitle,
    meta?.createdAt,
    meta?.updatedAt,
    meta?.publishedAt,
    meta?.slug,
    meta?.excerpt,
    meta?.heroImage,
    meta?.topics,
  ]);
}
