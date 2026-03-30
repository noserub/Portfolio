import { useEffect } from 'react';
import {
  getSEOData,
  getCaseStudySEO,
  applyPageSEO,
  loadSEODataFromSupabase,
  loadCaseStudySEOFromSupabase,
} from '../utils/seoManager';
import {
  generateWebSiteSchema,
  generateOrganizationSchema,
  generateBreadcrumbListSchema,
  generateArticleSchema,
  generatePersonSchema,
  injectMultipleStructuredData,
} from '../utils/structuredData';

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
          const personSchema = generatePersonSchema(seoData.sitewide, {
            name: seoData.sitewide.defaultAuthor,
            jobTitle: 'Product Design Leader',
            description: pageSEO?.description,
            image: pageSEO?.ogImage || seoData.sitewide.defaultOGImage,
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

// Hook specifically for case study detail pages
export function useCaseStudySEO(caseStudyId: string, caseStudyTitle?: string) {
  useEffect(() => {
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
        
        // Article schema for case study
        const articleUrl = caseStudySEO.canonicalUrl || `${seoData.sitewide.siteUrl}/project/${caseStudyId}`;
        schemas.push(generateArticleSchema(caseStudySEO, seoData.sitewide, {
          headline: caseStudyTitle || caseStudySEO.title,
          description: caseStudySEO.description,
          image: caseStudySEO.ogImage || caseStudySEO.twitterImage,
          url: articleUrl,
        }));
        
        // Breadcrumbs
        const breadcrumbs = [
          { name: 'Home', url: '/' },
          { name: caseStudyTitle || 'Case Study', url: articleUrl },
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
  }, [caseStudyId, caseStudyTitle]);
}
