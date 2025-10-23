import React, { useState, useRef, useEffect, memo } from 'react';
import { motion } from 'motion/react';
import { 
  generateResponsiveImageSet, 
  generateBlurPlaceholder, 
  getOptimalFormat,
  generateDataUrlPlaceholder,
  type ResponsiveImageSet 
} from '../utils/imageOptimizer';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: string;
  blurDataURL?: string;
  priority?: boolean; // For above-the-fold images
  sizes?: string; // Custom sizes attribute
  quality?: number; // 1-100
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  lazy?: boolean; // Enable/disable lazy loading
}

const OptimizedImage = memo(({ 
  src, 
  alt, 
  className = '', 
  style = {}, 
  onLoad, 
  onError,
  placeholder,
  blurDataURL,
  priority = false,
  sizes,
  quality = 80,
  width,
  height,
  fit = 'cover',
  lazy = true
}: OptimizedImageProps) => {
  const [isInView, setIsInView] = useState(priority); // Load immediately if priority
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [responsiveSet, setResponsiveSet] = useState<ResponsiveImageSet | null>(null);
  const [blurPlaceholder, setBlurPlaceholder] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate responsive image set and blur placeholder
  useEffect(() => {
    if (src) {
      const imageSet = generateResponsiveImageSet(src, alt, {
        quality,
        width,
        height,
        fit
      });
      setResponsiveSet(imageSet);
      
      // Generate blur placeholder
      const blur = generateBlurPlaceholder(src, { quality: 20, width: 20, height: 20 });
      setBlurPlaceholder(blur);
    }
  }, [src, alt, quality, width, height, fit]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !lazy) {
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
        rootMargin: '50px' // Start loading 50px before the image comes into view
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
  }, [priority, lazy]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate srcset strings
  const generateSrcSet = (urls: string[]) => {
    return urls.map((url, index) => {
      const width = [320, 640, 1024, 1280, 1920][index];
      return `${url} ${width}w`;
    }).join(', ');
  };

  // Get the optimal format for this browser
  const optimalFormat = getOptimalFormat();
  const srcSet = responsiveSet ? 
    (optimalFormat === 'webp' ? responsiveSet.webp : responsiveSet.jpeg) : 
    [];

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} style={style}>
      {/* Blur placeholder */}
      {!isLoaded && !hasError && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: isLoaded ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
        >
          <img
            src={blurDataURL || blurPlaceholder || placeholder || generateDataUrlPlaceholder()}
            alt=""
            className="w-full h-full object-cover filter blur-sm"
            style={{ imageRendering: 'pixelated' }}
          />
        </motion.div>
      )}

      {/* Main optimized image */}
      {isInView && responsiveSet && (
        <picture>
          {/* WebP source for modern browsers */}
          <source
            srcSet={generateSrcSet(responsiveSet.webp)}
            sizes={sizes || responsiveSet.sizes}
            type="image/webp"
          />
          {/* JPEG fallback */}
          <motion.img
            src={responsiveSet.jpeg[2]} // Default to medium size (1024px)
            srcSet={generateSrcSet(responsiveSet.jpeg)}
            sizes={sizes || responsiveSet.sizes}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            style={{
              objectFit: fit,
              ...style
            }}
          />
        </picture>
      )}

      {/* Fallback for non-responsive images */}
      {isInView && !responsiveSet && (
        <motion.img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          style={{
            objectFit: fit,
            ...style
          }}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400 text-sm text-center p-4">
            <div className="mb-2">📷</div>
            <div>Failed to load image</div>
          </div>
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
