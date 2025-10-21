import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface AppSettings {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  logo_url?: string;
  theme: string;
  is_authenticated: boolean;
  show_debug_panel: boolean;
}

export interface AppSettingsInsert {
  user_id: string;
  logo_url?: string;
  theme?: string;
  is_authenticated?: boolean;
  show_debug_panel?: boolean;
}

export interface AppSettingsUpdate {
  logo_url?: string;
  theme?: string;
  is_authenticated?: boolean;
  show_debug_panel?: boolean;
}

export function useAppSettings() {
  const [appSettings, setAppSettings] = useState<AppSettings[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all app settings
  const fetchAppSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAppSettings(data || []);
    } catch (err: any) {
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
      setError(err.message);
      return null;
    }
  };

  // Create app settings
  const createAppSettings = async (settings: AppSettingsInsert): Promise<AppSettings | null> => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .insert(settings)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setAppSettings(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
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
      
      // Update local state
      setAppSettings(prev => prev.map(s => s.id === id ? data : s));
      return data;
    } catch (err: any) {
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
      
      // Update local state
      setAppSettings(prev => prev.map(s => s.user_id === userId ? data : s));
      return data;
    } catch (err: any) {
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
      
      // Update local state
      setAppSettings(prev => prev.filter(s => s.id !== id));
      return true;
    } catch (err: any) {
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
      setError(err.message);
      return null;
    }
  };

  // Update current user's app settings
  const updateCurrentUserAppSettings = async (updates: AppSettingsUpdate): Promise<AppSettings | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      
      return await updateAppSettingsByUserId(user.id, updates);
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Toggle theme
  const toggleTheme = async (): Promise<AppSettings | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      
      const current = await getAppSettingsByUserId(user.id);
      if (!current) throw new Error('No app settings found');
      
      const newTheme = current.theme === 'light' ? 'dark' : 'light';
      
      return await updateAppSettingsByUserId(user.id, { theme: newTheme });
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Toggle debug panel
  const toggleDebugPanel = async (): Promise<AppSettings | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      
      const current = await getAppSettingsByUserId(user.id);
      if (!current) throw new Error('No app settings found');
      
      return await updateAppSettingsByUserId(user.id, { 
        show_debug_panel: !current.show_debug_panel 
      });
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Set authentication status
  const setAuthenticationStatus = async (isAuthenticated: boolean): Promise<AppSettings | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      
      return await updateAppSettingsByUserId(user.id, { is_authenticated: isAuthenticated });
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Get current user's settings
  const getCurrentUserSettings = async () => {
    try {
      // Load settings for the main user (brian.bureson@gmail.com) for all visitors
      // This ensures logo and favicon show for everyone
      const { data: mainProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'brian.bureson@gmail.com')
        .single();
        
      if (mainProfile) {
        const { data: mainUserSettings } = await supabase
          .from('app_settings')
          .select('*')
          .eq('user_id', mainProfile.id)
          .single();
          
        if (mainUserSettings) {
          console.log('📥 Retrieved main user settings for all visitors:', mainUserSettings);
          console.log('🖼️ Original logo URL:', mainUserSettings.logo_url);
          
          // Handle logo URL - only add cache-busting for non-data URLs
          if (mainUserSettings.logo_url) {
            if (mainUserSettings.logo_url.startsWith('data:')) {
              // For data URLs, don't add cache-busting as it corrupts the base64
              console.log('🖼️ Using data URL logo as-is (no cache-busting needed)');
              console.log('🖼️ Logo URL length:', mainUserSettings.logo_url.length);
            } else {
              // For regular URLs, add cache-busting
              const cacheBuster = `?v=${Date.now()}`;
              const logoUrl = mainUserSettings.logo_url.includes('?') 
                ? mainUserSettings.logo_url.split('?')[0] + cacheBuster
                : mainUserSettings.logo_url + cacheBuster;
              
              mainUserSettings.logo_url = logoUrl;
              console.log('🔄 Added cache-busting to regular URL:', logoUrl);
            }
          } else {
            console.log('❌ No logo URL found in settings');
          }
          
          setSettings(mainUserSettings);
        } else {
          console.log('📝 No main user settings found');
          setSettings(null);
        }
      } else {
        console.log('📝 No main profile found');
        setSettings(null);
      }
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
}

