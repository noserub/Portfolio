import { useState, useEffect, useCallback } from 'react';
import { getPostgrestErrorMessage, supabase } from '../lib/supabaseClient';
import { getPortfolioOwnerUserId, getProfileWriterUserId } from '../lib/portfolioOwner';

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
  /** When true, show icons on Highlights and Leadership & Impact cards. Default off. */
  about_highlights_leadership_decorative_icons?: boolean;
  /** URL opened by the Resume button on the About page */
  resume_url?: string | null;
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
  about_highlights_leadership_decorative_icons?: boolean;
  resume_url?: string | null;
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
  about_highlights_leadership_decorative_icons?: boolean;
  resume_url?: string | null;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/** Drop top-level undefined, JSON-roundtrip (fixes nested undefined / non-JSON values PostgREST rejects), clean arrays. */
function prepareProfileWritePayload<T extends Record<string, unknown>>(raw: T): T {
  const cleaned = stripUndefined(raw);
  try {
    const body = JSON.parse(JSON.stringify(cleaned)) as T;
    const b = body as {
      super_powers?: unknown[];
      section_order?: unknown[];
    };
    if (Array.isArray(b.super_powers)) {
      b.super_powers = b.super_powers.filter((x): x is string => typeof x === 'string');
    }
    if (Array.isArray(b.section_order)) {
      b.section_order = b.section_order.filter((x): x is string => typeof x === 'string');
    }
    return body;
  } catch {
    return cleaned as T;
  }
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
  const createProfile = async (profile: ProfileInsert): Promise<Profile> => {
    const payload = prepareProfileWritePayload(profile as Record<string, unknown>) as ProfileInsert;
    const { data, error } = await supabase
      .from('profiles')
      .insert(payload)
      .select()
      .single();

    if (error) {
      setError(getPostgrestErrorMessage(error));
      throw error;
    }

    setProfiles((prev) => [data, ...prev]);
    return data;
  };

  // Update profile (throws on PostgREST/RLS errors so callers can surface messages)
  const updateProfile = async (id: string, updates: ProfileUpdate): Promise<Profile> => {
    const payload = prepareProfileWritePayload(updates as Record<string, unknown>) as ProfileUpdate;
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      setError(getPostgrestErrorMessage(error));
      throw error;
    }

    setProfiles((prev) => prev.map((p) => (p.id === id ? data : p)));
    return data;
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
      const userId = getPortfolioOwnerUserId(user?.id);

      return await getProfile(userId);
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [getProfile]);

  function isPostgrestNoRowsError(err: unknown): boolean {
    const e = err as { code?: string; message?: string; details?: string };
    if (e?.code === 'PGRST116') return true;
    const combined = `${e?.message ?? ''} ${e?.details ?? ''}`;
    return /PGRST116|0 rows|contains 0 rows|no rows returned|multiple \(or no\) rows returned/i.test(
      combined,
    );
  }

  // Update current user's profile
  const updateCurrentUserProfile = async (updates: ProfileUpdate): Promise<Profile> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const isBypassAuth = localStorage.getItem('isAuthenticated') === 'true';

      if (!user && !isBypassAuth) {
        throw new Error('No authenticated user');
      }

      // Session id for writes — not env-first — or owner id when anon + bypass (see portfolioOwner).
      const writerUserId = getProfileWriterUserId(user?.id);

      try {
        return await updateProfile(writerUserId, updates);
      } catch (err: unknown) {
        if (!isPostgrestNoRowsError(err)) {
          const msg = getPostgrestErrorMessage(err);
          setError(msg);
          throw new Error(msg);
        }
        console.log('📝 Profile not found, creating new profile...');
        const newProfile = {
          id: writerUserId,
          email: user?.email || 'brian.bureson@gmail.com',
          full_name: 'Brian Bureson',
          ...updates,
        } as ProfileInsert;
        return await createProfile(newProfile);
      }
    } catch (err: unknown) {
      const message = getPostgrestErrorMessage(err);
      setError(message);
      throw new Error(message);
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

