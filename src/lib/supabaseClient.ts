import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { devLog } from './devLog'
import { ensureLocalStorageHeadroom, isQuotaExceededError } from './safeLocalStorage'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Use placeholder values if environment variables are not set
const url = supabaseUrl || 'https://placeholder.supabase.co'
const key = supabaseAnonKey || 'placeholder-key'

/** Supabase auth storage with sessionStorage fallback when localStorage quota is full. */
const supabaseAuthStorage = {
  getItem(storageKey: string): string | null {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(storageKey) ?? window.sessionStorage.getItem(storageKey)
  },
  setItem(storageKey: string, value: string): void {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(storageKey, value)
      window.sessionStorage.removeItem(storageKey)
      return
    } catch (err) {
      if (!isQuotaExceededError(err)) throw err
    }
    ensureLocalStorageHeadroom()
    try {
      window.localStorage.setItem(storageKey, value)
      window.sessionStorage.removeItem(storageKey)
      return
    } catch {
      window.sessionStorage.setItem(storageKey, value)
    }
  },
  removeItem(storageKey: string): void {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(storageKey)
    window.sessionStorage.removeItem(storageKey)
  },
}

if (import.meta.env.DEV) {
  devLog('🔍 Supabase env:', {
    supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
    supabaseAnonKey: supabaseAnonKey ? 'SET' : 'NOT SET',
    actualUrl: supabaseUrl,
  })
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables not set. Using placeholder values. Please configure .env.local with your Supabase credentials.')
}

// Database types (you can generate these with Supabase CLI)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string | null
          avatar_url: string | null
          resume_url?: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          resume_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          resume_url?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Singleton Supabase client (avoid multiple GoTrueClient instances)
let _supabase: SupabaseClient<Database> | undefined
export const supabase: SupabaseClient<Database> = _supabase ?? (
  _supabase = createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'sb-portfolio',
      storage: supabaseAuthStorage,
    }
  })
)

// Export the same client with a typed alias for backward compatibility
export const typedSupabase = supabase

/** PostgREST errors are often plain objects; never use `String(err)` or you get "[object Object]". */
export function getPostgrestErrorMessage(err: unknown): string {
  if (err instanceof Error && typeof err.message === 'string' && err.message.length > 0) {
    const details = (err as { details?: string }).details
    const hint = (err as { hint?: string }).hint
    const code = (err as { code?: string }).code
    const parts = [
      err.message,
      details ? `Details: ${details}` : '',
      hint ? `Hint: ${hint}` : '',
      code ? `[${code}]` : '',
    ].filter(Boolean)
    return parts.join(' ')
  }
  if (typeof err === 'object' && err !== null) {
    const o = err as Record<string, unknown>
    if (typeof o.message === 'string') {
      const details = typeof o.details === 'string' ? o.details : ''
      const hint = typeof o.hint === 'string' ? o.hint : ''
      const code = typeof o.code === 'string' ? o.code : ''
      return [o.message, details, hint, code].filter(Boolean).join(' ')
    }
  }
  try {
    return JSON.stringify(err)
  } catch {
    return String(err)
  }
}
