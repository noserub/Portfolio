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
          
          // HARDCODED CUSTOM LOGO - Always use your custom logo
          const customLogo = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAdwAAAEACAYAAAAZX8ehAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAABI9SURBVHgB7d2NleTUmQbgd/c4ADYCyxGAI6CIYE0ElCOwiYByBHgjoIjAQwSICIAIkDPAEXj7HnV7fpjpvqoqSVeq5zlHpweQD7hG8711f76rBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKA5/5X1ffR4cZkh98OzUm8Iz/EsXWcIk/0u6/vrw/VVuNavGf8QPP385+PPcv30+Pe3zrMy3a/57bPxr7x+JvbybEzlWbqNe6g7N9NC4HIb5dv6J8/88yHjH4AfHn/24R48jeS6Z+55KoxPz0a5hsDL1J0JBO796B6vPz3+dSmw/cP13cP1Kr6J3rOngnl44+8NGZ+PHx5/DoHpuqg7TTk9XP92rX59k7cLbotO2dZnuqfr+4zTsF324ZRtff57vb5J+3XnZv47MDpmLKq/PP4a3nR4uL7O+HyU5+QYm4643jF3VHcELu/qMn7rFLx8yCGvn5Hyswtcp8sd1B2By4d0ef0HoAv8VhnhHiN4uZ0uO647ApeXdBkf/jKdaAqRDzlG8HI7XXZYdwQutcqGmR+jmPK8Y8ZC+VXgeruqO9qCmKLLWExPD9ffsj3Dw/Xn7Ff3xq/fPEnp94//7KM3fs7tlDF8y3NyDlyuy7brzn8IXC5xyti7WcJrS310Xcb/7r/nvj0Fb7nK5/Hx488ut9VlnGL+NGOhHAKXO2Wbdacpp2yrb8z1+voly071nHKb/+5Pwvt0GQ8oOGf8vb31s9LS537Kun92XNc9S102yBou1+gy9tB12ZZ/xAaw9xkynv5zfLj+8Hh9mfFIvmt1Gdfivgpcp8s2647A5Wpdtvfwd1H4awwZp9//mDF8v83108Kn+MLD9bpsMHQFLrfQZXsPf9n9+EWoNeT1yPfPuS54y7S1He9cq8vG6o7A5Va6tPPwD5X3ldFbF6Y65/rg7bLRaUGa0mVDz5HA5Za6tDFdWNv6U/47vwmXOmcM3rID+ZJdo13GYmkTG9fospFlCoHLrZXiufb6aP9w/V/lvYeM08tc7pRxnffbTNdF6HK9FurOiwQuc/hr1g+xU+p315bj4w7hGkPGNd5LppnLyMT0Mtdqoe48S+Ayl/Jts8t6yhTn56mf6ixTy3bOXu/8cH2W6a1EQpdbWLvuPEvgMpcW1keH1B8F10Wr0K0MGaeYaz/7J13G0PXFh0s1vS9D4DKnQ9Z/t2XZidxX3qtV6LZOGQ/OmKLLuAEGLnVIo+/UFbjMrYXXa5Wp5aHyXq1Ct/V0cMaUXcyHjM8NXKrJ1/oJXOZWHvq1NzKUYq9VaD1lPbes604J3fLMHAKXaaHu/IbAZQl/yfqjxj5ahdZ0SeiWqeUucJkW6s5bBC5LKN82W9iQVEJUq9B6nkK3ltkGrtFK3fkPgctSjmljTUWr0LpK6NZO7xeHjGcvwyWOaejPsMBlSS1M0w6Z1ipk887tnTOtZcgXH67RzPKQwGVJZU2lhcJZds6+qrz3GOu5czilvl2rualBNqWVuiNwWCVxupTz0n4Uphkw7+vGb3IfaKfTvwr3bVN0RuNxCeejLRiAn/kxX1py0Cr3tUHnfOdyzzdUdgcu1nr5hDuFSp0xrFao9EGKLjqmbOh9iOvmebbLuCFyu8W3Gh97I9jpahV6rnU7W432/Nlt3BC6XKgXvGGF7K1Nahbrss1XomPqNYX24R5uuOwKXqcqDXr5dnsKt3XurUO2XiHMsYdybXdQdgcsU/cP1xxhdzOleW4WmHGNpOvm+9NlJ3RG41CgBUKY7bY6a35D7axXqUr/7+hzP4L3YXd0RuLyktK2Ub5d/D0u5t1ahMrqt3QRmdHsfdll3BC4f8rTtvuyeHcLSTqn/3L/OdluFjo9XjXM8i3u367ojcPmQp0Pzj2ENU1qFii22CnUZvyzUMrrdv13XHYHLcw4Z1wh/yVgYu7CkvbcKfZ9pU8lDuAeHqDuzOT1c/3Zt5vom6/0BOKXuv3Fvvk/978+fsg2lkNb+f/oltx+9nyrX99kB8FrhMtUx4wB8FVYypRWoS0Upr9k2kavMrp1wMp9O2YHdUfgcoku4wjhl1jjXcKQ/bQKHTJt5+k5XlLAqMvG647A5RpdxuK+i+mexu2hVajLuLmr1hAbpfitLhutOwKXWzhmnO45hDmdst1WoS7TNkkVZVQ/BN7vmI3VHYHLrXSxtju3p1ahKUc/ttAq1GV8NroJ/5sysu0Dz+uyobojcLm1U8apnr2+Pm5tpVWodpq1y/qFqIyyp4ZtHy/HYJpTNlB3BC5zOD5cP8a67lymvlVorVahQ6aH7ZD6DWLwpmMarzsCl7l0mV5sqdd6q1Bp/Zm6ZjvECzK4TpeG647AZU5dhO5chtQf/bhkq9DTv2vqofNP69ND4DpdGq07Ape5dRG6c+nTVqtQWa8tU3rHTFdG7D8FbqNLg3VH4LKELkJ3Lqe00SpUNmddun5WwvZV4La6NFZ3BC5L6bLNN9q0bu1WoUPGk39OuUwJ23NgHl0aqjsClyWV0dWU17FRZ41WoS7j6OHSEUT5glA2SJ0D82qm7ghclnaMwzHmsFSrUJfXr0475DJDxrDtA8s4poG6I3BZwymOgZzDlKMQp7YKHTKOZq89OL6Mxj+LDVIs75SV647AZS1lXaULtzTktm8V6jKOCkrI3uLM2m+jz5Z1rVp3BC5raf01clvV57pWofL3Ssg+jWZPub5AlfXaLzOOjL3XljWtWnd+F1jPIWPBn3pIAs87PVyfpq4FqGwmKUXo44y/H7fezVmmjvXY0pJDVqo7Ape1ldHUObcd+Rg5T/s859pMUnZOnwLtmaPuvEjgsrYyoioP/5e5nWNYUx/vsqVtc9SdF1nDpQVleqcLWzdk3BRlYxRbsHjdEbi0wjTwdg0ZR7R/iN5atmXRuiNwacUhRrlb0+d10J4D23PIgnVH4NKSud9mw/XKJpPyooGnqeNzYNsWqzsCl5Z8ES83aFWfcYNJGc1+HlPH7MdidUfg0pLy0B9DK8pItkwZ/0/G0WzpW3RwBXuzWN0RuLTmf0NLzhGy7N8idUcfLq05ZPzGeU2RH3Lffs3bn9/wzj8/pG6jSHmjkJPAuAeHXF93XiRwadEx1xX5P4TnlCMff6y8txwOUKaWh8C+HTPzl0tTyrTItPK8yrnGtSfslG/9/wjs3+x1R+DSoppD97nOlBfWl9+PrwP7NnvdEbi0qIyqhO78yg7k2jWrspZ7COzX7HVH4NIqgTu/IWNPba1yDJ4+afZM4HKXBO4y+tS/sL6LM6/ZN4HLXerCUk6pf0H8U6sQ7FGXGQlcWvVxWEpZx/089eu5pVWoC+zPrHVH4NIqa4XLGh6uv1Xeq1WIvZq17ghcWvVRhO7StApx72atOwKXlgnc5ZWp5aHyXq1C7JHABRZR1nH/POF+rUJQSeAC7+qjVQhuTuAC71Omi7UKwQ0JXOBDtArBDQlc4EOGTG8Vsp4LHyBwadkQ1lZahV5V3ltahb4KbNuQmQhcWlU7lcn8yq7lofJerUJs2ax1R+DSqiG0QqsQ92LIjAQurTLCbUufaa1Cjn5ki4xwuUs/h9aU6eK+8t5DtAqxPbPWHYFLq4bQojK1rFWIvRoyI4FLq2oPXWBZw8P1ZeW9ZR33+1jPZTtmrTsCl1b1oVXnTFvP1SrEVvSZkcClRX1o3SlahdiXPjMTuLTou9C6so77+YT7y67lLtCu2euOwKVFfdiCst41ZT3XW4VoWZ+ZCVxaM8SGqS0pRz/2lfceolWINg1ZoO4IXFrTh62Z2ir0SaAtfRYgcGlN7dtpaMeQ+qMfvVWIFi1SdwQuLenjwIutKm8U0irEFvVZqO4IXFrybdiyU6a1Cv0psL7F6o7ApRVDxgMV2K6nVqHa9dyya7kLrGfIgnVH4NIKa7f7UHZ61v5eahVibYvWHYFLC4YY3e6JViG2YMjCdUfg0gKj2/0pu5aHynu/jlYhlrd43RG4rG2I0e0eDalvFSq0CrGkISvUHYHL2j4Le9VHqxBtWqXuCFzWdI6+2707pf7IPK1CLOGcleqOwGUtQ6zd3gOtQrRkyIp1R+Cylimbati2IVqFaMOqdUfgsoZSfPtwT0qr0KvKew/RKsTtrV53BC5LK+t5p3CPtAqxlibqjsBlSUPG9TzuU1nH1SrE0oY0UncELkspxbZsxR/CPeujVYjlNFV3BC5LELa8qazPTmkV+iIwXXN1R+CyhDKNWFtguQ9TWoXKhqsuME1zdUfgMqenb5i1u1O5H0O0CjGPZuuOwGUuTw99H3i/MnKtffn3IVqFeFnTdUfgMofh4fpjTCPzshKiQ+W9pVXoEHi/IY3XHYHLrfUZH/oh8LKprUJlalmrEO/qs4G687vA7ZQ1uVPWdwpbU0YlNQdddBlbhb4MjFqpOy8SuNzCkHGU0qcNejf37amtqHb9l30a0lbdeZEpZa5VDjEoUzl9YDlahe7bJuuOwOVSfcYHvow2avsp4Va0Ct2nPhuuOwKXqfqM2+7LZRcyazpk3LnM/vXZQd0RuNTq8/qB7wNtKCOdQ9irPjuqOzZN8Zwh48aUsl5m2phWlanlMs3oGd2HITutOwKXd/UP1w+PP/tA+7qMU8tT+nlpS587qDsC976Vb4/9w/XPvH7QjRLYouPD9XPGURFtu9u6I3D3Z3jn178+Xv96469/euPXsBel/7ocWD+EpQ3v/FrdAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeMv/A4r31xJCnrnTAAAAAElFTkSuQmCC`;
          
          // Always use the hardcoded custom logo
          mainUserSettings.logo_url = customLogo;
          console.log('🖼️ Using hardcoded custom logo');
          
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

