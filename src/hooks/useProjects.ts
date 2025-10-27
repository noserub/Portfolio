import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface Project {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  title: string;
  description?: string;
  url?: string;
  position_x: number;
  position_y: number;
  scale: number;
  published: boolean;
  requires_password: boolean;
  password?: string;
  case_study_content?: string;
  case_study_images?: any[];
  flow_diagram_images?: any[];
  video_items?: any[];
  gallery_aspect_ratio: string;
  flow_diagram_aspect_ratio: string;
  video_aspect_ratio: string;
  gallery_columns: number;
  flow_diagram_columns: number;
  video_columns: number;
  project_images_position?: number;
  videos_position?: number;
  flow_diagrams_position?: number;
  solution_cards_position?: number;
  section_positions?: any;
  sort_order: number;
}

export interface ProjectInsert {
  user_id: string;
  title: string;
  description?: string;
  url?: string;
  position_x?: number;
  position_y?: number;
  scale?: number;
  published?: boolean;
  requires_password?: boolean;
  password?: string;
  case_study_content?: string;
  case_study_images?: any[];
  flow_diagram_images?: any[];
  video_items?: any[];
  gallery_aspect_ratio?: string;
  flow_diagram_aspect_ratio?: string;
  video_aspect_ratio?: string;
  gallery_columns?: number;
  flow_diagram_columns?: number;
  video_columns?: number;
  project_images_position?: number;
  videos_position?: number;
  flow_diagrams_position?: number;
  solution_cards_position?: number;
  section_positions?: any;
  sort_order?: number;
}

export interface ProjectUpdate {
  title?: string;
  description?: string;
  url?: string;
  position_x?: number;
  position_y?: number;
  scale?: number;
  published?: boolean;
  requires_password?: boolean;
  password?: string;
  case_study_content?: string;
  case_study_images?: any[];
  flow_diagram_images?: any[];
  video_items?: any[];
  gallery_aspect_ratio?: string;
  flow_diagram_aspect_ratio?: string;
  video_aspect_ratio?: string;
  gallery_columns?: number;
  flow_diagram_columns?: number;
  video_columns?: number;
  project_images_position?: number;
  videos_position?: number;
  flow_diagrams_position?: number;
  solution_cards_position?: number;
  section_positions?: any;
  sort_order?: number;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all projects
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('🔍 DEBUG: useProjects loaded projects:', data?.map(p => ({ id: p.id, title: p.title, requires_password: p.requires_password })));
      setProjects(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch published projects only
  const fetchPublishedProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get project by ID
  const getProject = useCallback(async (id: string): Promise<Project | null> => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  // Create project
  const createProject = useCallback(async (project: ProjectInsert): Promise<Project | null> => {
    try {
      console.log('🔄 useProjects: createProject called with:', project);
      
      // Check if user is authenticated (either Supabase auth or bypass)
      const { data: { user } } = await supabase.auth.getUser();
      const isBypassAuth = localStorage.getItem('isAuthenticated') === 'true';
      
      if (!user && !isBypassAuth) {
        console.log('❌ useProjects: No authenticated user for project creation, attempting to force authentication...');
        
        // Try to force authentication by checking if we have bypass auth
        const storedAuth = localStorage.getItem('isAuthenticated');
        console.log('🔍 Stored auth value:', storedAuth);
        
        if (storedAuth === 'true') {
          console.log('🔄 Bypass auth detected, proceeding with Supabase save...');
          // Continue with Supabase save using fallback user ID
        } else {
          console.log('❌ useProjects: No authentication found, cannot create project in Supabase');
          setError('Authentication required to create projects');
          return null;
        }
      }

      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setProjects(prev => [...prev, data].sort((a, b) => a.sort_order - b.sort_order));
      return data;
    } catch (err: any) {
      console.error('❌ useProjects: createProject error:', err);
      setError(err.message);
      return null;
    }
  }, []);

  // Update project
  const updateProject = useCallback(async (id: string, updates: ProjectUpdate): Promise<Project | null> => {
    try {
      console.log('🔄 useProjects: updateProject called with:', { id, updates });
      
      // Check content size to prevent timeouts
      if (updates.case_study_content && updates.case_study_content.length > 100000) {
        console.log('⚠️ Large content detected, truncating to prevent timeout...');
        updates.case_study_content = updates.case_study_content.substring(0, 100000) + '\n\n... [Content truncated to prevent timeout]';
      }
      
      // Check if user is authenticated (either Supabase auth or bypass)
      const { data: { user } } = await supabase.auth.getUser();
      const isBypassAuth = localStorage.getItem('isAuthenticated') === 'true';
      
      if (!user && !isBypassAuth) {
        console.log('❌ useProjects: No authenticated user, attempting to force authentication...');
        
        // Try to force authentication by checking if we have bypass auth
        const storedAuth = localStorage.getItem('isAuthenticated');
        console.log('🔍 Stored auth value:', storedAuth);
        
        if (storedAuth === 'true') {
          console.log('🔄 Bypass auth detected, proceeding with Supabase save...');
          // Continue with Supabase save using fallback user ID
        } else {
          console.log('❌ useProjects: No authentication found, saving to localStorage as fallback');
          // Save to localStorage as fallback for unauthenticated users
          try {
            const existingProjects = JSON.parse(localStorage.getItem('caseStudies') || '[]');
            const updatedProjects = existingProjects.map((p: any) => 
              p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
            );
            localStorage.setItem('caseStudies', JSON.stringify(updatedProjects));
            console.log('✅ useProjects: Changes saved to localStorage');
            
            // Update local state
            setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
            return { ...prev.find(p => p.id === id), ...updates } as Project;
          } catch (err) {
            console.error('❌ useProjects: Error saving to localStorage:', err);
            setError('Failed to save changes locally');
            return null;
          }
        }
      }
      
      if (isBypassAuth) {
        console.log('✅ useProjects: Bypass authentication detected');
      } else {
        console.log('✅ useProjects: User authenticated:', user.id);
      }
      
      // First, try to update the project normally with timeout handling
      console.log('🔄 useProjects: Attempting to update project in Supabase:', { id, updates });
      
      // Use fallback user ID for bypass auth
      const userId = user?.id || '7cd2752f-93c5-46e6-8535-32769fb10055';
      console.log('🔄 useProjects: Using user ID:', userId, 'Auth type:', user ? 'Supabase' : 'Bypass');
      
      let { data, error } = await Promise.race([
        supabase
          .from('projects')
          .update(updates)
          .eq('id', id)
          .select()
          .single(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Update timeout')), 30000)
        )
      ]) as any;
      
      console.log('🔄 useProjects: Supabase update result:', { data, error });

      // If that fails due to user mismatch, try to transfer ownership
      if (error && error.code === 'PGRST116') {
        console.log('🔄 Project ownership mismatch detected, attempting to transfer ownership...');
        
        // Get the current user or use fallback
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const fallbackUserId = '7cd2752f-93c5-46e6-8535-32769fb10055';
        const effectiveUserId = currentUser?.id || fallbackUserId;
        
        console.log('🔄 useProjects: Transfer ownership using user ID:', effectiveUserId);
        
        if (effectiveUserId) {
          try {
            // First, check if the project exists at all
            const { data: existingProject, error: fetchError } = await supabase
              .from('projects')
              .select('*')
              .eq('id', id)
              .single();
              
            if (fetchError) {
              console.log('❌ Project not found in database:', fetchError);
              // If project doesn't exist, create it with current user
              console.log('🔄 Creating new project with current user...');
              const { data: newProject, error: createError } = await supabase
                .from('projects')
                .insert({
                  id: id,
                  user_id: effectiveUserId,
                  ...updates
                })
                .select()
                .single();
                
              if (createError) {
                console.log('❌ Failed to create project:', createError);
                throw createError;
              } else {
                console.log('✅ Project created successfully');
                data = newProject;
                error = null;
              }
            } else {
              // Project exists, try to transfer ownership
              const transferData = {
                ...updates,
                user_id: effectiveUserId
              };
              
              const { data: transferResult, error: transferError } = await supabase
                .from('projects')
                .update(transferData)
                .eq('id', id)
                .select()
                .single();
                
              if (transferError) {
                console.log('❌ Transfer failed:', transferError);
                throw transferError;
              } else {
                console.log('✅ Project ownership transferred successfully');
                data = transferResult;
                error = null;
              }
            }
          } catch (transferError) {
            console.log('❌ All transfer attempts failed, checking for existing project with same title...');
            
            // Check if a project with the same title already exists for this user
            const { data: existingProjects, error: searchError } = await supabase
              .from('projects')
              .select('*')
              .eq('user_id', effectiveUserId)
              .eq('title', updates.title);
              
            if (searchError) {
              console.log('❌ Failed to search for existing projects:', searchError);
              throw searchError;
            }
            
            if (existingProjects && existingProjects.length > 0) {
              console.log('✅ Found existing project with same title, updating it instead');
              const existingProject = existingProjects[0];
              
              const { data: updatedProject, error: updateError } = await supabase
                .from('projects')
                .update(updates)
                .eq('id', existingProject.id)
                .select()
                .single();
                
              if (updateError) {
                console.log('❌ Failed to update existing project:', updateError);
                throw updateError;
              } else {
                console.log('✅ Updated existing project:', existingProject.id);
                data = updatedProject;
                error = null;
              }
            } else {
              console.log('🔄 No existing project found, creating new project with different ID...');
              // If all else fails, create a new project with a new ID
              const newId = crypto.randomUUID();
              const { data: newProject, error: createError } = await supabase
                .from('projects')
                .insert({
                  id: newId,
                  user_id: effectiveUserId,
                  ...updates
                })
                .select()
                .single();
                
              if (createError) {
                console.log('❌ Failed to create new project:', createError);
                throw createError;
              } else {
                console.log('✅ New project created with ID:', newId);
                data = newProject;
                error = null;
              }
            }
          }
        }
      }

      if (error) {
        console.log('❌ useProjects: Supabase update error:', error);
        throw error;
      }
      
      console.log('✅ useProjects: Project updated successfully:', data);
      
      // Update local state
      setProjects(prev => prev.map(p => p.id === id ? data : p));
      return data;
    } catch (err: any) {
      console.log('❌ useProjects: updateProject error:', err);
      setError(err.message);
      return null;
    }
  }, []);

  // Delete project
  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setProjects(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  // Reorder projects
  const reorderProjects = useCallback(async (projectIds: string[]): Promise<boolean> => {
    try {
      console.log('🔄 Reordering projects:', projectIds);
      
      // Update each project individually with its new sort order
      const updatePromises = projectIds.map(async (id, index) => {
        const { error } = await supabase
          .from('projects')
          .update({ sort_order: index })
          .eq('id', id);
          
        if (error) {
          console.error(`❌ Failed to update sort order for project ${id}:`, error);
          throw error;
        }
        
        console.log(`✅ Updated sort order for project ${id} to ${index}`);
      });
      
      await Promise.all(updatePromises);
      
      // Update local state
      setProjects(prev => {
        const reordered = projectIds.map(id => prev.find(p => p.id === id)).filter(Boolean) as Project[];
        const remaining = prev.filter(p => !projectIds.includes(p.id));
        return [...reordered, ...remaining];
      });
      
      console.log('✅ All projects reordered successfully');
      return true;
    } catch (err: any) {
      console.error('❌ Failed to reorder projects:', err);
      setError(err.message);
      return false;
    }
  }, []);

  // Get user's projects
  const getUserProjects = useCallback(async (userId: string): Promise<Project[]> => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, []);

  // Get current user's projects
  const getCurrentUserProjects = useCallback(async (): Promise<Project[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      return await getUserProjects(user.id);
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, [getUserProjects]);

  // Load projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    projects,
    loading,
    error,
    fetchProjects,
    fetchPublishedProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    reorderProjects,
    getUserProjects,
    getCurrentUserProjects,
    refetch: fetchProjects
  }), [
    projects,
    loading,
    error
  ]);
}

