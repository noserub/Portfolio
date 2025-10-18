import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface PageVisibility {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  about: boolean;
  contact: boolean;
  music: boolean;
  visuals: boolean;
}

export interface PageVisibilityInsert {
  user_id: string;
  about?: boolean;
  contact?: boolean;
  music?: boolean;
  visuals?: boolean;
}

export interface PageVisibilityUpdate {
  about?: boolean;
  contact?: boolean;
  music?: boolean;
  visuals?: boolean;
}

export function usePageVisibility() {
  const [pageVisibility, setPageVisibility] = useState<PageVisibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all page visibility settings
  const fetchPageVisibility = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('page_visibility')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPageVisibility(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get page visibility by ID
  const getPageVisibility = async (id: string): Promise<PageVisibility | null> => {
    try {
      const { data, error } = await supabase
        .from('page_visibility')
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

  // Get page visibility by user ID
  const getPageVisibilityByUserId = async (userId: string): Promise<PageVisibility | null> => {
    try {
      const { data, error } = await supabase
        .from('page_visibility')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Create page visibility
  const createPageVisibility = async (visibility: PageVisibilityInsert): Promise<PageVisibility | null> => {
    try {
      const { data, error } = await supabase
        .from('page_visibility')
        .insert(visibility)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setPageVisibility(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Update page visibility
  const updatePageVisibility = async (id: string, updates: PageVisibilityUpdate): Promise<PageVisibility | null> => {
    try {
      const { data, error } = await supabase
        .from('page_visibility')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setPageVisibility(prev => prev.map(pv => pv.id === id ? data : pv));
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Update page visibility by user ID
  const updatePageVisibilityByUserId = async (userId: string, updates: PageVisibilityUpdate): Promise<PageVisibility | null> => {
    try {
      const { data, error } = await supabase
        .from('page_visibility')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setPageVisibility(prev => prev.map(pv => pv.user_id === userId ? data : pv));
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Delete page visibility
  const deletePageVisibility = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('page_visibility')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setPageVisibility(prev => prev.filter(pv => pv.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // Get current user's page visibility
  const getCurrentUserPageVisibility = async (): Promise<PageVisibility | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      return await getPageVisibilityByUserId(user.id);
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Update current user's page visibility
  const updateCurrentUserPageVisibility = async (updates: PageVisibilityUpdate): Promise<PageVisibility | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      
      return await updatePageVisibilityByUserId(user.id, updates);
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Toggle page visibility
  const togglePageVisibility = async (page: keyof PageVisibilityUpdate): Promise<PageVisibility | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      
      const current = await getPageVisibilityByUserId(user.id);
      if (!current) throw new Error('No page visibility settings found');
      
      const updates = {
        [page]: !current[page]
      };
      
      return await updatePageVisibilityByUserId(user.id, updates);
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Get visible pages
  const getVisiblePages = (userId?: string): string[] => {
    const visibility = userId 
      ? pageVisibility.find(pv => pv.user_id === userId)
      : pageVisibility[0]; // Default to first user's settings
    
    if (!visibility) return ['about', 'contact', 'music', 'visuals']; // Default visible pages
    
    return Object.entries(visibility)
      .filter(([key, value]) => key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'user_id' && value === true)
      .map(([key]) => key);
  };

  // Load page visibility on mount
  useEffect(() => {
    fetchPageVisibility();
  }, []);

  return {
    pageVisibility,
    loading,
    error,
    fetchPageVisibility,
    getPageVisibility,
    getPageVisibilityByUserId,
    createPageVisibility,
    updatePageVisibility,
    updatePageVisibilityByUserId,
    deletePageVisibility,
    getCurrentUserPageVisibility,
    updateCurrentUserPageVisibility,
    togglePageVisibility,
    getVisiblePages,
    refetch: fetchPageVisibility
  };
}

