# Prompt 2: Database & State Architecture

## When to Use
**After Phase 1 assessment** - This prompt sets up the data layer and state management architecture.

## Objective
Implement a robust, scalable data architecture using Supabase with proper TypeScript types, custom hooks, and error handling patterns.

## Instructions

### Step 1: Supabase Setup
Set up Supabase integration with proper configuration:

1. **Create Supabase Client** (`/src/lib/supabaseClient.ts`)
   ```typescript
   import { createClient } from '@supabase/supabase-js'
   
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
   
   export const supabase = createClient(url, key, {
     auth: {
       autoRefreshToken: true,
       persistSession: true,
       detectSessionInUrl: true
     }
   })
   ```

2. **Environment Variables** (`.env.local`)
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Step 2: Database Schema Design
Create TypeScript interfaces for your database schema:

1. **Database Types** (`/src/types/database.ts`)
   ```typescript
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
         // Add other tables based on your project needs
       }
     }
   }
   ```

2. **Generate Types** (run this command)
   ```bash
   npx supabase gen types typescript --local > src/types/supabase.ts
   ```

### Step 3: Custom Hooks Architecture
Create a robust hooks system following the pattern from your portfolio:

1. **Base Hook Pattern** (`/src/hooks/useAppSettings.ts`)
   ```typescript
   import { useState, useEffect, useCallback } from 'react';
   import { supabase } from '../lib/supabaseClient';
   
   export function useAppSettings() {
     const [settings, setSettings] = useState(null);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState(null);
   
     const updateSettings = useCallback(async (newSettings) => {
       // Implementation
     }, []);
   
     const getCurrentUserSettings = useCallback(async () => {
       // Implementation
     }, []);
   
     return {
       settings,
       updateSettings,
       getCurrentUserSettings,
       loading,
       error
     };
   }
   ```

2. **Data Management Hook** (`/src/hooks/useProjects.ts`)
   ```typescript
   import { useState, useEffect, useCallback, useMemo } from 'react';
   import { supabase } from '../lib/supabaseClient';
   
   export function useProjects() {
     const [projects, setProjects] = useState([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState(null);
   
     const fetchProjects = useCallback(async () => {
       // Implementation with error handling
     }, []);
   
     const createProject = useCallback(async (project) => {
       // Implementation with authentication checks
     }, []);
   
     const updateProject = useCallback(async (id, updates) => {
       // Implementation with ownership transfer logic
     }, []);
   
     return useMemo(() => ({
       projects,
       loading,
       error,
       fetchProjects,
       createProject,
       updateProject
     }), [projects, loading, error]);
   }
   ```

### Step 4: Authentication Flow
Implement robust authentication:

1. **Authentication Hook** (`/src/hooks/useAuth.ts`)
   ```typescript
   export function useAuth() {
     const [isAuthenticated, setIsAuthenticated] = useState(false);
     const [user, setUser] = useState(null);
     const [loading, setLoading] = useState(true);
   
     useEffect(() => {
       // Check authentication state
       const checkAuthState = async () => {
         const { data: { user } } = await supabase.auth.getUser();
         const isBypassAuth = localStorage.getItem('isAuthenticated') === 'true';
         const isAuth = !!user || isBypassAuth;
         setIsAuthenticated(isAuth);
         setUser(user);
       };
   
       checkAuthState();
   
       // Listen for auth state changes
       const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
         // Handle auth state changes
       });
   
       return () => subscription.unsubscribe();
     }, []);
   
     return { isAuthenticated, user, loading };
   }
   ```

### Step 5: Error Boundaries
Implement comprehensive error handling:

1. **Error Boundary Component** (`/src/components/ErrorBoundary.tsx`)
   ```typescript
   import React from 'react';
   
   interface ErrorBoundaryState {
     hasError: boolean;
     error: Error | null;
   }
   
   class ErrorBoundary extends React.Component<{}, ErrorBoundaryState> {
     constructor(props) {
       super(props);
       this.state = { hasError: false, error: null };
     }
   
     static getDerivedStateFromError(error: Error): ErrorBoundaryState {
       return { hasError: true, error };
     }
   
     componentDidCatch(error: Error, errorInfo: any) {
       console.error('Error caught by boundary:', error, errorInfo);
     }
   
     render() {
       if (this.state.hasError) {
         return (
           <div className="error-fallback">
             <h2>Something went wrong</h2>
             <details>
               {this.state.error?.stack}
             </details>
           </div>
         );
       }
   
       return this.props.children;
     }
   }
   ```

### Step 6: Data Validation
Add proper data validation:

1. **Validation Utilities** (`/src/utils/validation.ts`)
   ```typescript
   export const validateEmail = (email: string): boolean => {
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     return emailRegex.test(email);
   };
   
   export const validateRequired = (value: any): boolean => {
     return value !== null && value !== undefined && value !== '';
   };
   ```

### Step 7: Cache Management
Implement intelligent caching:

1. **Cache Manager** (`/src/utils/cacheManager.ts`)
   ```typescript
   interface CacheItem<T> {
     data: T;
     timestamp: number;
     ttl: number;
     source: 'supabase' | 'localStorage' | 'fallback';
   }
   
   class CacheManager {
     private cache = new Map<string, CacheItem<any>>();
   
     async get<T>(key: string, fetcher: () => Promise<T>, options = {}): Promise<T> {
       // Implementation with fallback strategies
     }
   
     set<T>(key: string, data: T, ttl: number, source: string): void {
       // Implementation
     }
   }
   
   export const cacheManager = new CacheManager();
   ```

### Step 8: RLS Policies
Set up Row Level Security policies:

1. **Create RLS Policies** (SQL)
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   
   -- Create policies for authenticated users
   CREATE POLICY "Users can view own profile" ON profiles
     FOR SELECT USING (auth.uid() = id);
   
   CREATE POLICY "Users can update own profile" ON profiles
     FOR UPDATE USING (auth.uid() = id);
   ```

### Step 9: Real-time Subscriptions
Set up real-time updates where needed:

1. **Real-time Hook** (`/src/hooks/useRealtime.ts`)
   ```typescript
   export function useRealtime(table: string, callback: (payload: any) => void) {
     useEffect(() => {
       const subscription = supabase
         .channel(`${table}_changes`)
         .on('postgres_changes', 
           { event: '*', schema: 'public', table },
           callback
         )
         .subscribe();
   
       return () => {
         subscription.unsubscribe();
       };
     }, [table, callback]);
   }
   ```

### Step 10: Testing Setup
Add basic testing infrastructure:

1. **Test Utilities** (`/src/utils/testUtils.ts`)
   ```typescript
   export const mockSupabaseClient = {
     auth: {
       getUser: jest.fn(),
       signInWithPassword: jest.fn(),
       signOut: jest.fn()
     },
     from: jest.fn(() => ({
       select: jest.fn(),
       insert: jest.fn(),
       update: jest.fn(),
       delete: jest.fn()
     }))
   };
   ```

## Expected Output
After running this prompt, you should have:

1. ✅ Supabase client properly configured
2. ✅ TypeScript types for database schema
3. ✅ Custom hooks for data management
4. ✅ Authentication flow implemented
5. ✅ Error boundaries in place
6. ✅ Cache management system
7. ✅ RLS policies configured
8. ✅ Real-time subscriptions ready

## Next Steps
After completing this architecture:
- Run **Prompt 3: Performance Optimization** to optimize the data layer
- Or run **Prompt 5a: AI Integration** if AI features are needed
- Or run **Prompt 5d: Real-time Features** if real-time collaboration is needed

## Notes
- This prompt establishes the foundation for all data operations
- The patterns here are based on your working portfolio architecture
- All hooks follow the same pattern for consistency
- Error handling is comprehensive to prevent data loss

