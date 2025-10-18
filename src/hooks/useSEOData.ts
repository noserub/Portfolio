import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface SEOData {
  id: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  page_type: string;
  title?: string;
  description?: string;
  keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_card?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  canonical_url?: string;
  site_name?: string;
  site_url?: string;
  default_author?: string;
  default_og_image?: string;
  default_twitter_card?: string;
  favicon_type?: string;
  favicon_text?: string;
  favicon_gradient_start?: string;
  favicon_gradient_end?: string;
  favicon_image?: string;
}

export interface SEODataInsert {
  user_id?: string;
  page_type: string;
  title?: string;
  description?: string;
  keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_card?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  canonical_url?: string;
  site_name?: string;
  site_url?: string;
  default_author?: string;
  default_og_image?: string;
  default_twitter_card?: string;
  favicon_type?: string;
  favicon_text?: string;
  favicon_gradient_start?: string;
  favicon_gradient_end?: string;
  favicon_image?: string;
}

export interface SEODataUpdate {
  title?: string;
  description?: string;
  keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_card?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  canonical_url?: string;
  site_name?: string;
  site_url?: string;
  default_author?: string;
  default_og_image?: string;
  default_twitter_card?: string;
  favicon_type?: string;
  favicon_text?: string;
  favicon_gradient_start?: string;
  favicon_gradient_end?: string;
  favicon_image?: string;
}

export function useSEOData() {
  const [seoData, setSeoData] = useState<SEOData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all SEO data
  const fetchSEOData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('seo_data')
        .select('*')
        .order('page_type', { ascending: true });

      if (error) throw error;
      setSeoData(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get SEO data by page type
  const getSEODataByPageType = async (pageType: string): Promise<SEOData | null> => {
    try {
      const { data, error } = await supabase
        .from('seo_data')
        .select('*')
        .eq('page_type', pageType)
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Get SEO data by ID
  const getSEOData = async (id: string): Promise<SEOData | null> => {
    try {
      const { data, error } = await supabase
        .from('seo_data')
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

  // Create SEO data
  const createSEOData = async (seo: SEODataInsert): Promise<SEOData | null> => {
    try {
      const { data, error } = await supabase
        .from('seo_data')
        .insert(seo)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setSeoData(prev => [...prev, data]);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Update SEO data
  const updateSEOData = async (id: string, updates: SEODataUpdate): Promise<SEOData | null> => {
    try {
      const { data, error } = await supabase
        .from('seo_data')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setSeoData(prev => prev.map(s => s.id === id ? data : s));
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Update SEO data by page type
  const updateSEODataByPageType = async (pageType: string, updates: SEODataUpdate): Promise<SEOData | null> => {
    try {
      const { data, error } = await supabase
        .from('seo_data')
        .update(updates)
        .eq('page_type', pageType)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setSeoData(prev => prev.map(s => s.page_type === pageType ? data : s));
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Delete SEO data
  const deleteSEOData = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('seo_data')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setSeoData(prev => prev.filter(s => s.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // Get user's SEO data
  const getUserSEOData = async (userId: string): Promise<SEOData[]> => {
    try {
      const { data, error } = await supabase
        .from('seo_data')
        .select('*')
        .eq('user_id', userId)
        .order('page_type', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  };

  // Get current user's SEO data
  const getCurrentUserSEOData = async (): Promise<SEOData[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      return await getUserSEOData(user.id);
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  };

  // Get all page types
  const getPageTypes = (): string[] => {
    return [...new Set(seoData.map(s => s.page_type))];
  };

  // Get SEO data as object by page type
  const getSEODataByPageTypeObject = (): Record<string, SEOData> => {
    return seoData.reduce((acc, seo) => {
      acc[seo.page_type] = seo;
      return acc;
    }, {} as Record<string, SEOData>);
  };

  // Load SEO data on mount
  useEffect(() => {
    fetchSEOData();
  }, []);

  return {
    seoData,
    loading,
    error,
    fetchSEOData,
    getSEOData,
    getSEODataByPageType,
    createSEOData,
    updateSEOData,
    updateSEODataByPageType,
    deleteSEOData,
    getUserSEOData,
    getCurrentUserSEOData,
    getPageTypes,
    getSEODataByPageTypeObject,
    refetch: fetchSEOData
  };
}

