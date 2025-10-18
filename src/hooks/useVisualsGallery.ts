import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface GalleryImage {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  url: string;
  alt: string;
  sort_order: number;
}

export interface GalleryImageInsert {
  user_id: string;
  url: string;
  alt: string;
  sort_order?: number;
}

export interface GalleryImageUpdate {
  url?: string;
  alt?: string;
  sort_order?: number;
}

export function useVisualsGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all images
  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('visuals_gallery')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get image by ID
  const getImage = async (id: string): Promise<GalleryImage | null> => {
    try {
      const { data, error } = await supabase
        .from('visuals_gallery')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Create image
  const createImage = async (image: GalleryImageInsert): Promise<GalleryImage | null> => {
    try {
      const { data, error } = await supabase
        .from('visuals_gallery')
        .insert(image)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setImages(prev => [...prev, data].sort((a, b) => a.sort_order - b.sort_order));
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Update image
  const updateImage = async (id: string, updates: GalleryImageUpdate): Promise<GalleryImage | null> => {
    try {
      const { data, error } = await supabase
        .from('visuals_gallery')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setImages(prev => prev.map(img => img.id === id ? data : img));
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Delete image
  const deleteImage = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('visuals_gallery')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setImages(prev => prev.filter(img => img.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // Reorder images
  const reorderImages = async (imageIds: string[]): Promise<boolean> => {
    try {
      const updates = imageIds.map((id, index) => ({
        id,
        sort_order: index
      }));

      const { error } = await supabase
        .from('visuals_gallery')
        .upsert(updates);

      if (error) throw error;
      
      // Update local state
      setImages(prev => {
        const reordered = imageIds.map(id => prev.find(img => img.id === id)).filter(Boolean) as GalleryImage[];
        const remaining = prev.filter(img => !imageIds.includes(img.id));
        return [...reordered, ...remaining];
      });
      
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // Get user's images
  const getUserImages = async (userId: string): Promise<GalleryImage[]> => {
    try {
      const { data, error } = await supabase
        .from('visuals_gallery')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  };

  // Get current user's images
  const getCurrentUserImages = async (): Promise<GalleryImage[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      return await getUserImages(user.id);
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  };

  // Load images on mount
  useEffect(() => {
    fetchImages();
  }, []);

  return {
    images,
    loading,
    error,
    fetchImages,
    getImage,
    createImage,
    updateImage,
    deleteImage,
    reorderImages,
    getUserImages,
    getCurrentUserImages,
    refetch: fetchImages
  };
}

