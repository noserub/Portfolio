import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Use placeholder values if environment variables are not set
const url = supabaseUrl || 'https://placeholder.supabase.co'
const key = supabaseAnonKey || 'placeholder-key'

// Debug environment variables
console.log('🔍 Supabase Debug:', {
  supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
  supabaseAnonKey: supabaseAnonKey ? 'SET' : 'NOT SET',
  actualUrl: supabaseUrl,
  actualKey: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'NOT SET'
});

// Log warning if using placeholder values
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables not set. Using placeholder values. Please configure .env.local with your Supabase credentials.')
}

// Singleton Supabase client (avoid multiple GoTrueClient instances)
let _supabase: SupabaseClient | undefined
export const supabase: SupabaseClient = _supabase ?? (
  _supabase = createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'sb-portfolio'
    }
  })
)

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
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
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

// Typed Supabase client
let _typed: SupabaseClient<Database> | undefined
export const typedSupabase: SupabaseClient<Database> = _typed ?? (
  _typed = createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'sb-portfolio'
    }
  })
)
