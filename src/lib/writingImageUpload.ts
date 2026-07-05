import { supabase } from './supabaseClient';

function sanitizeUploadFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/** Upload to portfolio-images and return the direct public object URL (no transform params). */
export async function uploadWritingImage(file: File): Promise<string> {
  const filename = `${Date.now()}_${sanitizeUploadFilename(file.name)}`;

  const { error } = await supabase.storage.from('portfolio-images').upload(filename, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('portfolio-images').getPublicUrl(filename);

  if (!publicUrl) {
    throw new Error('Could not resolve public URL for uploaded image.');
  }

  return publicUrl;
}
