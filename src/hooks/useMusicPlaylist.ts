import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface Song {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  title: string;
  artist: string;
  duration: string;
  url: string;
  sort_order: number;
}

export interface SongInsert {
  user_id: string;
  title: string;
  artist: string;
  duration: string;
  url: string;
  sort_order?: number;
}

export interface SongUpdate {
  title?: string;
  artist?: string;
  duration?: string;
  url?: string;
  sort_order?: number;
}

export function useMusicPlaylist() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all songs
  const fetchSongs = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('music_playlist')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSongs(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get song by ID
  const getSong = async (id: string): Promise<Song | null> => {
    try {
      const { data, error } = await supabase
        .from('music_playlist')
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

  // Create song
  const createSong = async (song: SongInsert): Promise<Song | null> => {
    try {
      const { data, error } = await supabase
        .from('music_playlist')
        .insert(song)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setSongs(prev => [...prev, data].sort((a, b) => a.sort_order - b.sort_order));
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Update song
  const updateSong = async (id: string, updates: SongUpdate): Promise<Song | null> => {
    try {
      const { data, error } = await supabase
        .from('music_playlist')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setSongs(prev => prev.map(s => s.id === id ? data : s));
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Delete song
  const deleteSong = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('music_playlist')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setSongs(prev => prev.filter(s => s.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // Reorder songs
  const reorderSongs = async (songIds: string[]): Promise<boolean> => {
    try {
      const updates = songIds.map((id, index) => ({
        id,
        sort_order: index
      }));

      const { error } = await supabase
        .from('music_playlist')
        .upsert(updates);

      if (error) throw error;
      
      // Update local state
      setSongs(prev => {
        const reordered = songIds.map(id => prev.find(s => s.id === id)).filter(Boolean) as Song[];
        const remaining = prev.filter(s => !songIds.includes(s.id));
        return [...reordered, ...remaining];
      });
      
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // Get user's songs
  const getUserSongs = async (userId: string): Promise<Song[]> => {
    try {
      const { data, error } = await supabase
        .from('music_playlist')
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

  // Get current user's songs
  const getCurrentUserSongs = async (): Promise<Song[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      return await getUserSongs(user.id);
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  };

  // Load songs on mount
  useEffect(() => {
    fetchSongs();
  }, []);

  return {
    songs,
    loading,
    error,
    fetchSongs,
    getSong,
    createSong,
    updateSong,
    deleteSong,
    reorderSongs,
    getUserSongs,
    getCurrentUserSongs,
    refetch: fetchSongs
  };
}

