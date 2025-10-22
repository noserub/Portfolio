import { useEffect, useState } from 'react';

interface ThemeAwareLogoProps {
  logoUrl: string;
  alt?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  // Optional: provide a white variant URL for better quality
  whiteVariantUrl?: string;
}

export function ThemeAwareLogo({ 
  logoUrl, 
  alt = "Logo", 
  className = "h-12 object-contain transition-all duration-300 hover:opacity-80",
  onLoad,
  onError,
  whiteVariantUrl
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

    // If we have a white variant URL and we're in dark mode, use it
    if (whiteVariantUrl && isDarkMode) {
      setProcessedLogoUrl(whiteVariantUrl);
    } else {
      setProcessedLogoUrl(logoUrl);
    }
  }, [logoUrl, isDarkMode, whiteVariantUrl]);

  // Determine if we need CSS filter (only if no white variant provided)
  const needsFilter = isDarkMode && !whiteVariantUrl;

  return (
    <img 
      src={processedLogoUrl} 
      alt={alt} 
      className={className}
      style={{
        filter: needsFilter ? 'brightness(0) invert(1)' : 'none',
        transition: 'filter 0.3s ease-in-out'
      }}
      onLoad={onLoad}
      onError={onError}
    />
  );
}
