import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface ContactMessage {
  id: string;
  created_at: string;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  user_id?: string;
}

export interface ContactMessageInsert {
  name: string;
  email: string;
  message: string;
  user_id?: string;
}

export interface ContactMessageUpdate {
  is_read?: boolean;
}

export function useContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all messages (now works for authenticated users to see all messages)
  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated (required to view messages)
      const { data: { user } } = await supabase.auth.getUser();
      const isBypassAuth = localStorage.getItem('isAuthenticated') === 'true';
      
      if (!user && !isBypassAuth) {
        setError('Authentication required to view messages');
        setMessages([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get message by ID
  const getMessage = async (id: string): Promise<ContactMessage | null> => {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
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

  // Create message
  const createMessage = async (message: ContactMessageInsert): Promise<ContactMessage | null> => {
    try {
      console.log('📤 useContactMessages: Creating message:', message);
      
      // Try to get current user, but don't require authentication
      const { data: { user } } = await supabase.auth.getUser();
      console.log('📤 useContactMessages: Current user:', user ? 'authenticated' : 'anonymous');
      
      const messageData = {
        ...message,
        user_id: user?.id || null // Allow null for anonymous users
      };
      
      const { data, error } = await supabase
        .from('contact_messages')
        .insert(messageData)
        .select()
        .single();

      console.log('📤 useContactMessages: Supabase response:', { data, error });

      if (error) {
        console.error('❌ useContactMessages: Supabase error:', error);
        throw error;
      }
      
      console.log('✅ useContactMessages: Message created successfully:', data);
      
      // Update local state
      setMessages(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      console.error('❌ useContactMessages: Error creating message:', err);
      setError(err.message);
      return null;
    }
  };

  // Update message
  const updateMessage = async (id: string, updates: ContactMessageUpdate): Promise<ContactMessage | null> => {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setMessages(prev => prev.map(m => m.id === id ? data : m));
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Delete message
  const deleteMessage = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setMessages(prev => prev.filter(m => m.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // Mark message as read
  const markAsRead = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // Mark message as unread
  const markAsUnread = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_read: false })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: false } : m));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // Mark all messages as read
  const markAllAsRead = async (): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;
      
      // Update local state
      setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // Get unread messages count
  const getUnreadCount = (): number => {
    return messages.filter(m => !m.is_read).length;
  };

  // Get user's messages
  const getUserMessages = async (userId: string): Promise<ContactMessage[]> => {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  };

  // Get current user's messages
  const getCurrentUserMessages = async (): Promise<ContactMessage[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      return await getUserMessages(user.id);
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  };

  // Load messages on mount
  useEffect(() => {
    fetchMessages();
  }, []);

  return {
    messages,
    loading,
    error,
    fetchMessages,
    getMessage,
    createMessage,
    updateMessage,
    deleteMessage,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    getUnreadCount,
    getUserMessages,
    getCurrentUserMessages,
    refetch: fetchMessages
  };
}

