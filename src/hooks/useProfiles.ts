import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface Profile {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  bio_paragraph_1?: string;
  bio_paragraph_2?: string;
  super_powers_title?: string;
  super_powers?: string[];
  highlights_title?: string;
  highlights?: any[];
  leadership_title?: string;
  leadership_items?: any[];
  expertise_title?: string;
  expertise_items?: any[];
  how_i_use_ai_title?: string;
  how_i_use_ai_items?: any[];
  process_title?: string;
  process_subheading?: string;
  process_items?: any[];
  certifications_title?: string;
  certifications_items?: any[];
  tools_title?: string;
  tools_categories?: any[];
  section_order?: string[];
  research_insights?: any[];
}

export interface ProfileInsert {
  id?: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  bio_paragraph_1?: string;
  bio_paragraph_2?: string;
  super_powers_title?: string;
  super_powers?: string[];
  highlights_title?: string;
  highlights?: any[];
  leadership_title?: string;
  leadership_items?: any[];
  expertise_title?: string;
  expertise_items?: any[];
  how_i_use_ai_title?: string;
  how_i_use_ai_items?: any[];
  process_title?: string;
  process_subheading?: string;
  process_items?: any[];
  certifications_title?: string;
  certifications_items?: any[];
  tools_title?: string;
  tools_categories?: any[];
  section_order?: string[];
  research_insights?: any[];
}

export interface ProfileUpdate {
  full_name?: string;
  avatar_url?: string;
  bio_paragraph_1?: string;
  bio_paragraph_2?: string;
  super_powers_title?: string;
  super_powers?: string[];
  highlights_title?: string;
  highlights?: any[];
  leadership_title?: string;
  leadership_items?: any[];
  expertise_title?: string;
  expertise_items?: any[];
  how_i_use_ai_title?: string;
  how_i_use_ai_items?: any[];
  process_title?: string;
  process_subheading?: string;
  process_items?: any[];
  certifications_title?: string;
  certifications_items?: any[];
  tools_title?: string;
  tools_categories?: any[];
  section_order?: string[];
  research_insights?: any[];
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all profiles
  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get profile by ID
  const getProfile = useCallback(async (id: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  // Create profile
  const createProfile = async (profile: ProfileInsert): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setProfiles(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Update profile
  const updateProfile = async (id: string, updates: ProfileUpdate): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setProfiles(prev => prev.map(p => p.id === id ? data : p));
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Delete profile
  const deleteProfile = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setProfiles(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // Get current user's profile
  const getCurrentUserProfile = useCallback(async (): Promise<Profile | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const isBypassAuth = localStorage.getItem('isAuthenticated') === 'true';
      
      if (!user && !isBypassAuth) {
        return null;
      }
      
      // Use bypass user ID if no real user
      const userId = user?.id || '7cd2752f-93c5-46e6-8535-32769fb10055';
      
      return await getProfile(userId);
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [getProfile]);

  // Update current user's profile
  const updateCurrentUserProfile = async (updates: ProfileUpdate): Promise<Profile | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const isBypassAuth = localStorage.getItem('isAuthenticated') === 'true';
      
      if (!user && !isBypassAuth) {
        throw new Error('No authenticated user');
      }
      
      // Use bypass user ID if no real user
      const userId = user?.id || '7cd2752f-93c5-46e6-8535-32769fb10055';
      
      // Try to update existing profile first
      let result = await updateProfile(userId, updates);
      
      // If no existing profile, create one
      if (!result) {
        console.log('📝 Profile not found, creating new profile...');
        const newProfile = {
          id: userId,
          email: user?.email || 'brian.bureson@gmail.com',
          full_name: 'Brian Bureson',
          ...updates
        };
        result = await createProfile(newProfile);
      }
      
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Load profiles on mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  return {
    profiles,
    loading,
    error,
    fetchProfiles,
    getProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    getCurrentUserProfile,
    updateCurrentUserProfile,
    refetch: fetchProfiles
  };
}

