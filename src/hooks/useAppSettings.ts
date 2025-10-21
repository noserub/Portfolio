import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface AppSettings {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  logo_url?: string;
  theme: 'light' | 'dark';
  is_authenticated: boolean;
  show_debug_panel: boolean;
}

export interface AppSettingsUpdate {
  logo_url?: string;
  theme?: 'light' | 'dark';
  is_authenticated?: boolean;
  show_debug_panel?: boolean;
}

export const useAppSettings = () => {
  const [appSettings, setAppSettings] = useState<AppSettings[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all app settings
  const fetchAppSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAppSettings(data || []);
    } catch (err: any) {
      console.error('Error fetching app settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get app settings by ID
  const getAppSettings = async (id: string): Promise<AppSettings | null> => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error getting app settings:', err);
      setError(err.message);
      return null;
    }
  };

  // Get app settings by user ID
  const getAppSettingsByUserId = async (userId: string): Promise<AppSettings | null> => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error getting app settings by user ID:', err);
      setError(err.message);
      return null;
    }
  };

  // Create new app settings
  const createAppSettings = async (settings: Omit<AppSettings, 'id' | 'created_at' | 'updated_at'>): Promise<AppSettings | null> => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .insert([settings])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error creating app settings:', err);
      setError(err.message);
      return null;
    }
  };

  // Update app settings
  const updateAppSettings = async (id: string, updates: AppSettingsUpdate): Promise<AppSettings | null> => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error updating app settings:', err);
      setError(err.message);
      return null;
    }
  };

  // Update app settings by user ID
  const updateAppSettingsByUserId = async (userId: string, updates: AppSettingsUpdate): Promise<AppSettings | null> => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error updating app settings by user ID:', err);
      setError(err.message);
      return null;
    }
  };

  // Delete app settings
  const deleteAppSettings = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error deleting app settings:', err);
      setError(err.message);
      return false;
    }
  };

  // Get current user's app settings
  const getCurrentUserAppSettings = async (): Promise<AppSettings | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      return await getAppSettingsByUserId(user.id);
    } catch (err: any) {
      console.error('Error getting current user app settings:', err);
      setError(err.message);
      return null;
    }
  };

  // Update current user's app settings
  const updateCurrentUserAppSettings = async (updates: AppSettingsUpdate): Promise<AppSettings | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      return await updateAppSettingsByUserId(user.id, updates);
    } catch (err: any) {
      console.error('Error updating current user app settings:', err);
      setError(err.message);
      return null;
    }
  };

  // Get current user's settings
  const getCurrentUserSettings = async () => {
    try {
      console.log('🔍 Using direct Supabase Storage logo URL (clean version)...');
      
      // Clear any old localStorage data to prevent conflicts
      localStorage.removeItem('portfolio_logo_url');
      localStorage.removeItem('logo');
      
      // Create settings object with your logo from Supabase Storage
      const settings = {
        id: 'direct-storage',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'direct-storage',
        logo_url: 'https://ljapwsajftxltykmpsmz.supabase.co/storage/v1/object/public/portfolio-images/BrB-black.png',
        theme: 'dark',
        is_authenticated: false,
        show_debug_panel: false
      };
      
      console.log('✅ Using direct Supabase Storage logo URL');
      setSettings(settings);
    } catch (err: any) {
      console.error('Error getting user settings:', err);
      setError(err.message);
      setSettings(null);
    }
  };

  // Update current user's settings (simple wrapper)
  const updateSettings = async (updates: AppSettingsUpdate): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // If no user, create a default settings record
        const defaultSettings = {
          user_id: 'anonymous',
          ...updates
        };
        const result = await createAppSettings(defaultSettings);
        if (result) {
          setSettings(result);
          return true;
        }
        return false;
      }
      
      // Try to update existing settings first
      let result = await updateCurrentUserAppSettings(updates);
      
      // If no existing settings, create new ones
      if (!result) {
        const newSettings = {
          user_id: user.id,
          theme: 'dark',
          is_authenticated: true,
          show_debug_panel: false,
          ...updates
        };
        result = await createAppSettings(newSettings);
      }
      
      if (result) {
        console.log('🔄 Settings updated in hook:', result);
        setSettings(result);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Error updating settings:', err);
      setError(err.message);
      return false;
    }
  };

  // Toggle theme
  const toggleTheme = async () => {
    const newTheme = settings?.theme === 'dark' ? 'light' : 'dark';
    await updateSettings({ theme: newTheme });
  };

  // Toggle debug panel
  const toggleDebugPanel = async () => {
    const newDebugPanel = !settings?.show_debug_panel;
    await updateSettings({ show_debug_panel: newDebugPanel });
  };

  // Set authentication status
  const setAuthenticationStatus = async (isAuthenticated: boolean) => {
    await updateSettings({ is_authenticated: isAuthenticated });
  };

  // Load app settings on mount
  useEffect(() => {
    fetchAppSettings();
    getCurrentUserSettings();
  }, []);

  return {
    appSettings,
    settings,
    loading,
    error,
    fetchAppSettings,
    getAppSettings,
    getAppSettingsByUserId,
    createAppSettings,
    updateAppSettings,
    updateAppSettingsByUserId,
    deleteAppSettings,
    getCurrentUserAppSettings,
    updateCurrentUserAppSettings,
    updateSettings,
    getCurrentUserSettings,
    toggleTheme,
    toggleDebugPanel,
    setAuthenticationStatus,
    refetch: fetchAppSettings
  };
};