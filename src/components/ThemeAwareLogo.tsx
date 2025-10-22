import { useEffect, useState } from 'react';

interface ThemeAwareLogoProps {
  logoUrl: string;
  alt?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function ThemeAwareLogo({ 
  logoUrl, 
  alt = "Logo", 
  className = "h-12 object-contain transition-all duration-300 hover:opacity-80",
  onLoad,
  onError 
}: ThemeAwareLogoProps) {
  const [processedLogoUrl, setProcessedLogoUrl] = useState<string>(logoUrl);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Check if we're in dark mode
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    // Check initial theme
    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Process logo URL based on theme
  useEffect(() => {
    if (!logoUrl) return;

    // If it's a Supabase Storage URL, we can modify it
    if (logoUrl.includes('supabase.co/storage')) {
      // For now, we'll use CSS filters to invert the logo in dark mode
      // This is a simple solution that works with any logo
      setProcessedLogoUrl(logoUrl);
    } else {
      setProcessedLogoUrl(logoUrl);
    }
  }, [logoUrl, isDarkMode]);

  return (
    <img 
      src={processedLogoUrl} 
      alt={alt} 
      className={className}
      style={{
        filter: isDarkMode ? 'brightness(0) invert(1)' : 'none',
        transition: 'filter 0.3s ease-in-out'
      }}
      onLoad={onLoad}
      onError={onError}
    />
  );
}
