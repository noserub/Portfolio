/**
 * Image Helper Utilities
 * 
 * This module provides utilities for handling images in a way that's optimized for localStorage
 * while maintaining the ability to upgrade to a real image storage service (like Supabase, Cloudinary, etc.)
 * 
 * CURRENT MODE: Placeholder images
 * - Images are replaced with Unsplash placeholder URLs
 * - JSON files remain small (<100KB typically)
 * - Ready to swap for real image URLs from your database
 * 
 * TO UPGRADE TO REAL IMAGE STORAGE:
 * 1. Choose a service (Supabase Storage, Cloudinary, AWS S3, etc.)
 * 2. Replace generatePlaceholderUrl() to upload to your service
 * 3. Update the upload handlers in FlowDiagramGallery.tsx and ProjectDetail.tsx
 * 4. See IMAGE_STORAGE_GUIDE.md for detailed instructions
 */

/**
 * Generates a placeholder image URL
 * This is what's stored in localStorage instead of base64 data
 * 
 * @param file - The original file (used for dimensions and filename)
 * @param category - Category for semantic placeholders (portrait, landscape, product, etc.)
 * @returns A placeholder URL (currently Unsplash, easy to replace with your service)
 */
export function generatePlaceholderUrl(file: File, category: 'portrait' | 'landscape' | 'hero' | 'diagram' = 'landscape'): string {
  // Generate a consistent seed based on filename and timestamp for variety
  const seed = Math.abs(hashCode(file.name + Date.now()));
  
  // Unsplash placeholder - replace this URL with your image service later
  const width = category === 'portrait' ? 800 : 1200;
  const height = category === 'portrait' ? 1200 : 800;
  
  // Use Unsplash's random image API with a seed for consistency
  // Categories: 'architecture', 'nature', 'business', 'technology', 'minimal'
  const queries: Record<string, string> = {
    portrait: 'portrait,people',
    landscape: 'business,minimal',
    hero: 'technology,design',
    diagram: 'minimal,abstract'
  };
  
  return `https://images.unsplash.com/photo-${seed % 10000000000}?w=${width}&h=${height}&q=80&fit=crop`;
}

/**
 * Simple hash function for generating consistent seeds
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Checks if a URL is a base64 data URL
 */
export function isBase64Image(url: string): boolean {
  return url.startsWith('data:image/');
}

/**
 * Checks if a URL is a placeholder (external URL, not base64 or blob)
 */
export function isPlaceholderImage(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Checks if a URL is a blob URL (temporary preview)
 */
export function isBlobUrl(url: string): boolean {
  return url.startsWith('blob:');
}

/**
 * Converts a base64 data URL to a placeholder URL
 * Used during export to reduce file size
 */
export function convertBase64ToPlaceholder(base64Url: string, category: 'portrait' | 'landscape' | 'hero' | 'diagram' = 'landscape'): string {
  if (isPlaceholderImage(base64Url)) {
    return base64Url; // Already a placeholder
  }
  
  // Generate a seed based on the base64 data (first 100 chars for consistency)
  const seed = Math.abs(hashCode(base64Url.substring(0, 100)));
  const width = category === 'portrait' ? 800 : 1200;
  const height = category === 'portrait' ? 1200 : 800;
  
  return `https://images.unsplash.com/photo-${seed % 10000000000}?w=${width}&h=${height}&q=80&fit=crop`;
}

/**
 * Processes a file upload and returns a preview URL
 * This creates a blob URL so users can see their actual uploaded images
 * 
 * @param file - The uploaded file
 * @param category - Image category (not used for preview, but kept for API compatibility)
 * @returns Promise<string> - Blob URL for immediate preview
 * 
 * NOTE: Blob URLs work great for previews but don't persist across sessions.
 * When you export data, these will be replaced with placeholders to keep file size small.
 * 
 * TO UPGRADE to real storage: Replace URL.createObjectURL with your upload service's URL
 * Example with Supabase:
 * ```typescript
 * const { data, error } = await supabase.storage
 *   .from('images')
 *   .upload(`${Date.now()}_${file.name}`, file);
 * return data.publicUrl;
 * ```
 */
export async function uploadImage(
  file: File, 
  category: 'portrait' | 'landscape' | 'hero' | 'diagram' = 'landscape'
): Promise<string> {
  // Create a blob URL for immediate preview
  // This shows the actual uploaded image to the user
  const blobUrl = URL.createObjectURL(file);
  return Promise.resolve(blobUrl);
  
  // FUTURE: Replace with real upload service
  // When you have a backend, uncomment and modify this:
  /*
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('YOUR_UPLOAD_ENDPOINT', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    return data.url; // Return the real URL from your service
  } catch (error) {
    console.error('Upload failed:', error);
    // Fallback to blob URL if upload fails
    return URL.createObjectURL(file);
  }
  */
}

/**
 * Strips all base64 images and blob URLs from an object and replaces with placeholders
 * Used during export to create lightweight JSON files
 */
export function stripBase64Images<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => stripBase64Images(item)) as T;
  }
  
  const result: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Check if this is an image URL field
    if (typeof value === 'string') {
      if (key === 'url' && isBase64Image(value)) {
        // Replace base64 with placeholder
        result[key] = convertBase64ToPlaceholder(value, 'landscape');
      } else if (key === 'url' && isBlobUrl(value)) {
        // Replace blob URL with placeholder
        result[key] = generatePlaceholderUrl({ name: 'image.jpg' } as File, 'landscape');
      } else if (isBase64Image(value)) {
        // Any other base64 string
        result[key] = convertBase64ToPlaceholder(value, 'landscape');
      } else if (isBlobUrl(value)) {
        // Any other blob URL
        result[key] = generatePlaceholderUrl({ name: 'image.jpg' } as File, 'landscape');
      } else {
        result[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively process nested objects
      result[key] = stripBase64Images(value);
    } else {
      result[key] = value;
    }
  }
  
  return result as T;
}

/**
 * Estimates the size reduction from using placeholders
 */
export function estimateSizeReduction(data: any): {
  originalSize: number;
  strippedSize: number;
  reductionPercent: number;
} {
  const originalJson = JSON.stringify(data);
  const strippedData = stripBase64Images(data);
  const strippedJson = JSON.stringify(strippedData);
  
  const originalSize = originalJson.length * 2; // UTF-16 = 2 bytes per char
  const strippedSize = strippedJson.length * 2;
  const reductionPercent = ((originalSize - strippedSize) / originalSize) * 100;
  
  return {
    originalSize,
    strippedSize,
    reductionPercent
  };
}
