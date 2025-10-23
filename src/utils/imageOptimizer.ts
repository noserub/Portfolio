/**
 * Image Optimization Utilities
 * 
 * This module provides comprehensive image optimization to reduce egress usage:
 * - WebP conversion with JPEG fallback
 * - Responsive image sizing
 * - Quality optimization
 * - Progressive loading
 * - CDN integration
 */

export interface ImageOptimizationOptions {
  quality?: number; // 1-100, default 80
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  blur?: number; // 0-1000, for blur placeholders
}

export interface ResponsiveImageSet {
  webp: string[];
  jpeg: string[];
  sizes: string;
  alt: string;
}

/**
 * Generates optimized image URLs for Supabase Storage
 * Uses Supabase's built-in image transformation API
 */
export function generateOptimizedImageUrl(
  originalUrl: string,
  options: ImageOptimizationOptions = {}
): string {
  const {
    quality = 80,
    format = 'auto',
    width,
    height,
    fit = 'cover',
    blur = 0
  } = options;

  // If it's already a Supabase Storage URL, add transformation parameters
  if (originalUrl.includes('supabase.co/storage')) {
    const url = new URL(originalUrl);
    const params = new URLSearchParams();
    
    if (quality !== 80) params.set('quality', quality.toString());
    if (format !== 'auto') params.set('format', format);
    if (width) params.set('width', width.toString());
    if (height) params.set('height', height.toString());
    if (fit !== 'cover') params.set('fit', fit);
    if (blur > 0) params.set('blur', blur.toString());
    
    // Add transformation parameters to the URL
    const queryString = params.toString();
    if (queryString) {
      return `${originalUrl}?${queryString}`;
    }
  }
  
  return originalUrl;
}

/**
 * Generates responsive image sets for different screen sizes
 * Returns WebP and JPEG versions for maximum compatibility
 */
export function generateResponsiveImageSet(
  originalUrl: string,
  alt: string,
  baseOptions: ImageOptimizationOptions = {}
): ResponsiveImageSet {
  const sizes = [
    { width: 320, suffix: 'sm' },
    { width: 640, suffix: 'md' },
    { width: 1024, suffix: 'lg' },
    { width: 1280, suffix: 'xl' },
    { width: 1920, suffix: '2xl' }
  ];

  const webp: string[] = [];
  const jpeg: string[] = [];

  sizes.forEach(({ width, suffix }) => {
    // WebP version (25-35% smaller)
    webp.push(generateOptimizedImageUrl(originalUrl, {
      ...baseOptions,
      width,
      format: 'webp',
      quality: Math.max(60, baseOptions.quality || 80 - 10) // Slightly lower quality for WebP
    }));

    // JPEG fallback
    jpeg.push(generateOptimizedImageUrl(originalUrl, {
      ...baseOptions,
      width,
      format: 'jpeg',
      quality: baseOptions.quality || 80
    }));
  });

  return {
    webp,
    jpeg,
    sizes: '(max-width: 640px) 320px, (max-width: 1024px) 640px, (max-width: 1280px) 1024px, (max-width: 1920px) 1280px, 1920px',
    alt
  };
}

/**
 * Generates a blur placeholder for progressive loading
 * Creates a very low quality, small version of the image
 */
export function generateBlurPlaceholder(
  originalUrl: string,
  options: ImageOptimizationOptions = {}
): string {
  return generateOptimizedImageUrl(originalUrl, {
    ...options,
    width: 20,
    height: 20,
    quality: 20,
    blur: 5,
    format: 'jpeg'
  });
}

/**
 * Optimizes an image for web display
 * Reduces file size while maintaining visual quality
 */
export function optimizeForWeb(
  originalUrl: string,
  options: ImageOptimizationOptions = {}
): string {
  return generateOptimizedImageUrl(originalUrl, {
    quality: 80,
    format: 'auto',
    fit: 'cover',
    ...options
  });
}

/**
 * Generates a thumbnail for gallery views
 * Small, optimized version for quick loading
 */
export function generateThumbnail(
  originalUrl: string,
  options: ImageOptimizationOptions = {}
): string {
  return generateOptimizedImageUrl(originalUrl, {
    width: 300,
    height: 300,
    quality: 70,
    format: 'auto',
    fit: 'cover',
    ...options
  });
}

/**
 * Generates a hero image optimized for different screen sizes
 * Larger images for hero sections with responsive sizing
 */
export function generateHeroImage(
  originalUrl: string,
  options: ImageOptimizationOptions = {}
): ResponsiveImageSet {
  const sizes = [
    { width: 640, suffix: 'sm' },
    { width: 1024, suffix: 'md' },
    { width: 1280, suffix: 'lg' },
    { width: 1920, suffix: 'xl' },
    { width: 2560, suffix: '2xl' }
  ];

  const webp: string[] = [];
  const jpeg: string[] = [];

  sizes.forEach(({ width, suffix }) => {
    // WebP version
    webp.push(generateOptimizedImageUrl(originalUrl, {
      ...options,
      width,
      format: 'webp',
      quality: Math.max(70, (options.quality || 85) - 5)
    }));

    // JPEG fallback
    jpeg.push(generateOptimizedImageUrl(originalUrl, {
      ...options,
      width,
      format: 'jpeg',
      quality: options.quality || 85
    }));
  });

  return {
    webp,
    jpeg,
    sizes: '(max-width: 640px) 640px, (max-width: 1024px) 1024px, (max-width: 1280px) 1280px, (max-width: 1920px) 1920px, 2560px',
    alt: options.alt || ''
  };
}

/**
 * Calculates the estimated file size reduction
 * Returns percentage of size reduction achieved
 */
export function calculateSizeReduction(
  originalSize: number,
  optimizedSize: number
): number {
  return Math.round(((originalSize - optimizedSize) / originalSize) * 100);
}

/**
 * Gets the optimal image format for the browser
 * Returns 'webp' if supported, 'jpeg' as fallback
 */
export function getOptimalFormat(): 'webp' | 'jpeg' {
  // Check if WebP is supported
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  try {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0 ? 'webp' : 'jpeg';
  } catch (e) {
    return 'jpeg';
  }
}

/**
 * Preloads critical images for better performance
 * Returns a promise that resolves when image is loaded
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Generates a data URL for a small placeholder
 * Used for immediate display while loading
 */
export function generateDataUrlPlaceholder(
  width: number = 20,
  height: number = 20,
  color: string = '#f3f4f6'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
  }
  
  return canvas.toDataURL('image/jpeg', 0.1);
}
