import React, { useState, useRef, useEffect, memo } from 'react';
import { motion } from 'motion/react';
import { 
  generateThumbnail, 
  generateBlurPlaceholder, 
  getOptimalFormat,
  generateDataUrlPlaceholder
} from '../utils/imageOptimizer';

interface ThumbnailImageProps {
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
  lazy?: boolean;
  size?: number; // Thumbnail size (default 300px)
}

const ThumbnailImage = memo(({ 
  src, 
  alt, 
  className = '', 
  style = {}, 
  onLoad, 
  onError,
  placeholder,
  blurDataURL,
  quality = 70,
  fit = 'cover',
  lazy = true,
  size = 300
}: ThumbnailImageProps) => {
  const [isInView, setIsInView] = useState(!lazy);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [blurPlaceholder, setBlurPlaceholder] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate thumbnail URL and blur placeholder
  useEffect(() => {
    if (src) {
      const thumbnail = generateThumbnail(src, {
        quality,
        width: size,
        height: size,
        fit
      });
      setThumbnailUrl(thumbnail);
      
      // Generate blur placeholder
      const blur = generateBlurPlaceholder(src, { 
        quality: 15, 
        width: 10, 
        height: 10 
      });
      setBlurPlaceholder(blur);
    }
  }, [src, quality, size, fit]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy) {
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
        rootMargin: '20px' // Smaller margin for thumbnails
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
  }, [lazy]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} style={style}>
      {/* Blur placeholder */}
      {!isLoaded && !hasError && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: isLoaded ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
        >
          <img
            src={blurDataURL || blurPlaceholder || placeholder || generateDataUrlPlaceholder(10, 10)}
            alt=""
            className="w-full h-full object-cover filter blur-sm"
            style={{ imageRendering: 'pixelated' }}
          />
        </motion.div>
      )}

      {/* Main thumbnail image */}
      {isInView && thumbnailUrl && (
        <motion.img
          src={thumbnailUrl}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
          style={{
            objectFit: fit,
            ...style
          }}
        />
      )}

      {/* Fallback for non-optimized images */}
      {isInView && !thumbnailUrl && (
        <motion.img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading={lazy ? 'lazy' : 'eager'}
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
          <div className="text-gray-500 dark:text-gray-400 text-xs text-center p-2">
            <div className="mb-1">📷</div>
            <div>Failed to load</div>
          </div>
        </div>
      )}
    </div>
  );
});

ThumbnailImage.displayName = 'ThumbnailImage';

export default ThumbnailImage;
