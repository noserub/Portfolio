import React, { useState, useRef, useEffect, memo } from 'react';
import { motion } from 'motion/react';
import { 
  generateHeroImage, 
  generateBlurPlaceholder, 
  getOptimalFormat,
  generateDataUrlPlaceholder,
  type ResponsiveImageSet 
} from '../utils/imageOptimizer';

interface HeroImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: string;
  blurDataURL?: string;
  quality?: number; // 1-100
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  priority?: boolean;
}

const HeroImage = memo(({ 
  src, 
  alt, 
  className = '', 
  style = {}, 
  onLoad, 
  onError,
  placeholder,
  blurDataURL,
  quality = 85,
  fit = 'cover',
  priority = true // Hero images are typically above the fold
}: HeroImageProps) => {
  const [isInView, setIsInView] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [heroImageSet, setHeroImageSet] = useState<ResponsiveImageSet | null>(null);
  const [blurPlaceholder, setBlurPlaceholder] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate hero image set and blur placeholder
  useEffect(() => {
    if (src) {
      const imageSet = generateHeroImage(src, {
        quality,
        fit
      });
      setHeroImageSet(imageSet);
      
      // Generate blur placeholder
      const blur = generateBlurPlaceholder(src, { quality: 20, width: 40, height: 40 });
      setBlurPlaceholder(blur);
    }
  }, [src, quality, fit]);

  // Intersection Observer for lazy loading (usually not needed for hero images)
  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px' // Start loading earlier for hero images
      }
    );

    const currentRef = imgRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate srcset strings for hero images
  const generateSrcSet = (urls: string[]) => {
    return urls.map((url, index) => {
      const width = [640, 1024, 1280, 1920, 2560][index];
      return `${url} ${width}w`;
    }).join(', ');
  };

  // Get the optimal format for this browser
  const optimalFormat = getOptimalFormat();
  const srcSet = heroImageSet ? 
    (optimalFormat === 'webp' ? heroImageSet.webp : heroImageSet.jpeg) : 
    [];

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} style={style}>
      {/* Enhanced blur placeholder for hero images */}
      {!isLoaded && !hasError && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: isLoaded ? 0 : 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center"
        >
          <img
            src={blurDataURL || blurPlaceholder || placeholder || generateDataUrlPlaceholder(40, 40)}
            alt=""
            className="w-full h-full object-cover filter blur-md"
            style={{ imageRendering: 'pixelated' }}
          />
          {/* Loading indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </motion.div>
      )}

      {/* Main optimized hero image */}
      {isInView && heroImageSet && (
        <picture>
          {/* WebP source for modern browsers */}
          <source
            srcSet={generateSrcSet(heroImageSet.webp)}
            sizes={heroImageSet.sizes}
            type="image/webp"
          />
          {/* JPEG fallback */}
          <motion.img
            src={heroImageSet.jpeg[2]} // Default to large size (1280px)
            srcSet={generateSrcSet(heroImageSet.jpeg)}
            sizes={heroImageSet.sizes}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            loading="eager" // Hero images should load immediately
            decoding="async"
            style={{
              objectFit: fit,
              ...style
            }}
          />
        </picture>
      )}

      {/* Fallback for non-responsive images */}
      {isInView && !heroImageSet && (
        <motion.img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading="eager"
          decoding="async"
          style={{
            objectFit: fit,
            ...style
          }}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400 text-center p-8">
            <div className="text-4xl mb-4">📷</div>
            <div className="text-lg font-medium mb-2">Image failed to load</div>
            <div className="text-sm">Please try refreshing the page</div>
          </div>
        </div>
      )}
    </div>
  );
});

HeroImage.displayName = 'HeroImage';

export default HeroImage;
