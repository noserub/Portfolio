import { useEffect } from 'react';
import { getSEOData, getCaseStudySEO, updateFavicon, applyPageSEO } from '../utils/seoManager';

export function useSEO(pageKey: 'home' | 'about' | 'caseStudies' | 'contact') {
  useEffect(() => {
    const seoData = getSEOData();
    const pageSEO = seoData.pages[pageKey];
    // Apply meta tags imperatively (no Helmet)
    if (pageSEO) {
      applyPageSEO(pageSEO, seoData.sitewide);
    }
    // Update favicon on every page
    updateFavicon(seoData.sitewide);
  }, [pageKey]);
}

// Hook specifically for case study detail pages
export function useCaseStudySEO(caseStudyId: string, caseStudyTitle?: string) {
  useEffect(() => {
    const seoData = getSEOData();
    const caseStudySEO = getCaseStudySEO(caseStudyId, caseStudyTitle);
    // Apply meta tags for case study page
    applyPageSEO(caseStudySEO, seoData.sitewide);
    updateFavicon(seoData.sitewide);
  }, [caseStudyId, caseStudyTitle]);
}
