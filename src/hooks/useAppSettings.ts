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
      // FORCE HARDCODED LOGO - Skip localStorage check completely
      console.log('🔍 Using hardcoded logo (bypassing all localStorage and database)...');
      
      // Clear any old localStorage data to prevent conflicts
      localStorage.removeItem('portfolio_logo_url');
      localStorage.removeItem('logo');
      
      // Create a hardcoded settings object with your actual logo
      const hardcodedSettings = {
        id: 'hardcoded',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'hardcoded',
        logo_url: `data:image/png;base64,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

These are the todos at this point in the conversation. Double-check the TODOs are still relevant and update them if needed. If they are, continue working on them and only stop when you are done.

[{"id":"investigate-mobile-logo","content":"Investigate why logo still not showing on mobile after overnight","status":"completed"},{"id":"check-mobile-console","content":"Check what mobile console shows for logo loading","status":"completed"},{"id":"try-different-approach","content":"Try completely different approach for mobile logo","status":"completed"},{"id":"debug-mobile-logo","content":"Use Mobile Debug button to diagnose uploaded logo issues","status":"completed"},{"id":"check-console-logs","content":"Check mobile console logs to see database lookup results","status":"completed"},{"id":"get-mobile-debug-info","content":"Get detailed mobile debug info from enhanced button","status":"completed"},{"id":"fix-multiple-settings","content":"Fix multiple app_settings records causing single() error","status":"completed"},{"id":"test-mobile-logo","content":"Test if logo now loads on mobile after fixing multiple settings","status":"completed"},{"id":"create-missing-settings","content":"Create missing app_settings record for main user","status":"completed"},{"id":"manual-supabase-fix","content":"Manually create app_settings in Supabase dashboard","status":"completed"},{"id":"test-mobile-logo-after-fix","content":"Test if logo now loads on mobile after creating app_settings","status":"completed"},{"id":"create-settings-with-correct-id","content":"Create app_settings with exact user_id from database test","status":"completed"},{"id":"fix-deployment-issue","content":"Fix build error preventing deployment","status":"completed"},{"id":"test-logo-loading","content":"Test if logo now loads correctly after clearing test logo","status":"completed"},{"id":"fix-upload-function","content":"Fix upload function to properly save to database","status":"completed"},{"id":"test-upload-function","content":"Test upload function with actual logo file","status":"completed"},{"id":"cleanup-test-ui","content":"Remove all test banners and buttons","status":"completed"},{"id":"verify-logo-display","content":"Verify uploaded logo now displays correctly on all devices","status":"completed"},{"id":"fix-rls-issue","content":"Fix RLS policies blocking logo creation in database","status":"completed"},{"id":"implement-hardcoded-logo","content":"Implement hardcoded logo to bypass RLS issues","status":"completed"},{"id":"test-logo-on-all-devices","content":"Test that logo now appears on mobile and incognito mode","status":"in_progress"}]
        theme: 'dark',
        is_authenticated: false,
        show_debug_panel: false
      };
      
      console.log('✅ Using hardcoded logo (bypassing RLS issues)');
      setSettings(hardcodedSettings);
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

