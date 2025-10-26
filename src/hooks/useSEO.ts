import { useEffect } from 'react';
import { getSEOData, applyPageSEO, getCaseStudySEO, updateFavicon } from '../utils/seoManager';

export function useSEO(pageKey: 'home' | 'about' | 'caseStudies' | 'contact') {
  useEffect(() => {
    const seoData = getSEOData();
    const pageSEO = seoData.pages[pageKey];
    
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
    applyPageSEO(caseStudySEO, seoData.sitewide);
  }, [caseStudyId, caseStudyTitle]);
}
