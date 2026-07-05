import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { setLegacyAuthFlag } from "../lib/safeLocalStorage";

type SiteAuthContextValue = {
  user: User | null;
  session: Session | null;
  /** True once initial session has been read from Supabase. */
  isAuthInitialized: boolean;
  /** Use for CMS, edit mode, messages, settings — never trust localStorage alone. */
  isSupabaseAuthenticated: boolean;
  refreshSession: () => Promise<void>;
};

const SiteAuthContext = createContext<SiteAuthContextValue | null>(null);

/**
 * Single source for Supabase session state.
 * Legacy `isAuthenticated` local flag is best-effort only — never used for privilege checks.
 */
export function SiteAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  const applySession = useCallback((next: Session | null) => {
    setSession(next);
    setLegacyAuthFlag(Boolean(next?.user));
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      applySession(s);
      setIsAuthInitialized(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      applySession(nextSession);
      setIsAuthInitialized(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const refreshSession = useCallback(async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    applySession(s);
  }, [applySession]);

  const user = session?.user ?? null;
  const value = useMemo<SiteAuthContextValue>(
    () => ({
      user,
      session,
      isAuthInitialized,
      isSupabaseAuthenticated: !!user,
      refreshSession,
    }),
    [user, session, isAuthInitialized, refreshSession],
  );

  return (
    <SiteAuthContext.Provider value={value}>{children}</SiteAuthContext.Provider>
  );
}

export function useSiteAuth(): SiteAuthContextValue {
  const ctx = useContext(SiteAuthContext);
  if (!ctx) {
    throw new Error("useSiteAuth must be used within SiteAuthProvider");
  }
  return ctx;
}
