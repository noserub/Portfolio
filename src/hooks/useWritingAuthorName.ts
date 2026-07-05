import { useEffect, useState } from 'react';
import { DEFAULT_OWNER_DISPLAY_NAME } from '../lib/portfolioLinks';
import { getSEOData, loadSEODataFromSupabase } from '../utils/seoManager';
import { usePortfolioProfileNav } from './usePortfolioProfileNav';

export function useWritingAuthorName(): string {
  const { fullName } = usePortfolioProfileNav();
  const [seoAuthor, setSeoAuthor] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void loadSEODataFromSupabase()
      .then((data) => {
        if (cancelled) return;
        const name = data.sitewide.defaultAuthor?.trim();
        if (name) setSeoAuthor(name);
      })
      .catch(() => {
        if (cancelled) return;
        const name = getSEOData().sitewide.defaultAuthor?.trim();
        if (name) setSeoAuthor(name);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return seoAuthor || fullName || DEFAULT_OWNER_DISPLAY_NAME;
}
