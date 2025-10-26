import { useEffect } from 'react';
import { getSEOData, getCaseStudySEO, updateFavicon } from '../utils/seoManager';
import { Helmet } from 'react-helmet-async';

export function useSEO(pageKey: 'home' | 'about' | 'caseStudies' | 'contact') {
  useEffect(() => {
    const seoData = getSEOData();
    const pageSEO = seoData.pages[pageKey];
    
    // Helmet will render tags in the consuming component; here we just ensure favicon is in sync
    
    // Update favicon on every page
    updateFavicon(seoData.sitewide);
  }, [pageKey]);
}

// Hook specifically for case study detail pages
export function useCaseStudySEO(caseStudyId: string, caseStudyTitle?: string) {
  useEffect(() => {
    const seoData = getSEOData();
    const caseStudySEO = getCaseStudySEO(caseStudyId, caseStudyTitle);
    // Favicon only; Helmet should be used in the page to render meta
    updateFavicon(seoData.sitewide);
  }, [caseStudyId, caseStudyTitle]);
}
