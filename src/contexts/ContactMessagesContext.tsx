import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { notifyContactEmailFromClient } from "../lib/contactEmailApi";
import { supabase } from "../lib/supabaseClient";
import { useSiteAuth } from "./SiteAuthContext";

export interface ContactMessage {
  id: string;
  created_at: string;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  is_archived?: boolean;
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
  is_archived?: boolean;
}

type ContactMessagesContextValue = {
  messages: ContactMessage[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  fetchMessages: () => Promise<void>;
  getMessage: (id: string) => Promise<ContactMessage | null>;
  createMessage: (message: ContactMessageInsert) => Promise<ContactMessage | null>;
  updateMessage: (id: string, updates: ContactMessageUpdate) => Promise<ContactMessage | null>;
  deleteMessage: (id: string) => Promise<boolean>;
  markAsRead: (id: string) => Promise<boolean>;
  markAsUnread: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  getUnreadCount: () => number;
  getUserMessages: (userId: string) => Promise<ContactMessage[]>;
  getCurrentUserMessages: () => Promise<ContactMessage[]>;
  refetch: () => Promise<void>;
};

const ContactMessagesContext = createContext<ContactMessagesContextValue | null>(null);

function countUnread(messages: ContactMessage[]): number {
  return messages.filter((m) => !m.is_read && !m.is_archived).length;
}

export function ContactMessagesProvider({ children }: { children: React.ReactNode }) {
  const { isSupabaseAuthenticated, isAuthInitialized } = useSiteAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = useMemo(() => countUnread(messages), [messages]);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        setMessages([]);
        setError(null);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setMessages(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthInitialized) return;

    if (!isSupabaseAuthenticated) {
      setMessages([]);
      setError(null);
      setLoading(false);
      return;
    }

    void fetchMessages();
  }, [isAuthInitialized, isSupabaseAuthenticated, fetchMessages]);

  useEffect(() => {
    if (!isSupabaseAuthenticated) return;

    const onFocus = () => {
      void fetchMessages();
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [isSupabaseAuthenticated, fetchMessages]);

  useEffect(() => {
    if (!isSupabaseAuthenticated) return;

    const channel = supabase
      .channel("portfolio-contact-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "contact_messages" },
        (payload) => {
          const row = payload.new as ContactMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [row, ...prev];
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "contact_messages" },
        (payload) => {
          const row = payload.new as ContactMessage;
          setMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "contact_messages" },
        (payload) => {
          const row = payload.old as { id?: string };
          if (!row.id) return;
          setMessages((prev) => prev.filter((m) => m.id !== row.id));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isSupabaseAuthenticated]);

  const getMessage = useCallback(async (id: string): Promise<ContactMessage | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from("contact_messages")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;
      return data;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load message");
      return null;
    }
  }, []);

  const createMessage = useCallback(async (message: ContactMessageInsert): Promise<ContactMessage | null> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const messageData = {
        ...message,
        user_id: user?.id || null,
      };

      const { data, error: insertError } = await supabase
        .from("contact_messages")
        .insert(messageData)
        .select()
        .single();

      if (insertError) throw insertError;

      const emailSent = await notifyContactEmailFromClient({
        name: message.name,
        email: message.email,
        message: message.message,
        messageId: data.id,
      });

      if (!emailSent) {
        console.warn(
          "Contact message saved but email notification failed. Check RESEND_API_KEY and CONTACT_NOTIFY_TO.",
        );
      }

      if (user?.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [data, ...prev];
        });
      }

      return data;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      return null;
    }
  }, []);

  const updateMessage = useCallback(
    async (id: string, updates: ContactMessageUpdate): Promise<ContactMessage | null> => {
      try {
        const { data, error: updateError } = await supabase
          .from("contact_messages")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (updateError) throw updateError;
        setMessages((prev) => prev.map((m) => (m.id === id ? data : m)));
        return data;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to update message");
        return null;
      }
    },
    [],
  );

  const deleteMessage = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase.from("contact_messages").delete().eq("id", id);
      if (deleteError) throw deleteError;
      setMessages((prev) => prev.filter((m) => m.id !== id));
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete message");
      return false;
    }
  }, []);

  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from("contact_messages")
        .update({ is_read: true })
        .eq("id", id);

      if (updateError) throw updateError;
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_read: true } : m)));
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to mark message as read");
      return false;
    }
  }, []);

  const markAsUnread = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from("contact_messages")
        .update({ is_read: false })
        .eq("id", id);

      if (updateError) throw updateError;
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_read: false } : m)));
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to mark message as unread");
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from("contact_messages")
        .update({ is_read: true })
        .eq("is_read", false);

      if (updateError) throw updateError;
      setMessages((prev) => prev.map((m) => ({ ...m, is_read: true })));
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to mark all as read");
      return false;
    }
  }, []);

  const getUnreadCount = useCallback(() => unreadCount, [unreadCount]);

  const getUserMessages = useCallback(async (userId: string): Promise<ContactMessage[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from("contact_messages")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load user messages");
      return [];
    }
  }, []);

  const getCurrentUserMessages = useCallback(async (): Promise<ContactMessage[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    return getUserMessages(user.id);
  }, [getUserMessages]);

  const value = useMemo<ContactMessagesContextValue>(
    () => ({
      messages,
      loading,
      error,
      unreadCount,
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
      refetch: fetchMessages,
    }),
    [
      messages,
      loading,
      error,
      unreadCount,
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
    ],
  );

  return (
    <ContactMessagesContext.Provider value={value}>{children}</ContactMessagesContext.Provider>
  );
}

export function useContactMessages(): ContactMessagesContextValue {
  const ctx = useContext(ContactMessagesContext);
  if (!ctx) {
    throw new Error("useContactMessages must be used within ContactMessagesProvider");
  }
  return ctx;
}
