import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getPortfolioOwnerUserId } from '../lib/portfolioOwner';
import { devLog } from '../lib/devLog';
import { copyCaseStudySEO } from '../utils/seoManager';

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
  hero_scale?: number | null;
  hero_position_x?: number | null;
  hero_position_y?: number | null;
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
  key_features_columns?: number;
  project_images_position?: number;
  videos_position?: number;
  flow_diagrams_position?: number;
  solution_cards_position?: number;
  section_positions?: any;
  sort_order: number;
  project_type?: 'product-design' | 'development' | 'branding';
  case_study_decorative_icons?: boolean;
  case_study_sidebars?: Record<string, unknown>;
  case_study_sections?: unknown[];
}

export interface ProjectInsert {
  user_id: string;
  title: string;
  description?: string;
  url?: string;
  position_x?: number;
  position_y?: number;
  scale?: number;
  hero_scale?: number | null;
  hero_position_x?: number | null;
  hero_position_y?: number | null;
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
  key_features_columns?: number;
  project_images_position?: number;
  videos_position?: number;
  flow_diagrams_position?: number;
  solution_cards_position?: number;
  section_positions?: any;
  sort_order?: number;
  project_type?: 'product-design' | 'development' | 'branding';
  case_study_decorative_icons?: boolean;
  case_study_sidebars?: Record<string, unknown>;
  case_study_sections?: unknown[];
}

export interface ProjectUpdate {
  title?: string;
  description?: string;
  url?: string;
  position_x?: number;
  position_y?: number;
  scale?: number;
  hero_scale?: number | null;
  hero_position_x?: number | null;
  hero_position_y?: number | null;
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
  key_features_columns?: number;
  project_images_position?: number;
  videos_position?: number;
  flow_diagrams_position?: number;
  solution_cards_position?: number;
  section_positions?: any;
  sort_order?: number;
  project_type?: 'product-design' | 'development' | 'branding';
  case_study_decorative_icons?: boolean;
  case_study_sidebars?: Record<string, unknown>;
  case_study_sections?: unknown[];
}

/** Shared project list + mutations. Prefer consuming via `ProjectsProvider` + `useProjects` from `contexts/ProjectsContext` so the app only mounts one instance (avoids duplicate full-table fetches). */
export function useProjectsState() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all projects (signed-in owner: full rows; anonymous: RPC strips password-gated payloads)
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false });
        if (error) throw error;
        setProjects(data || []);
      } else {
        const { data, error } = await supabase.rpc("get_projects_public");
        if (error) throw error;
        setProjects((data as Project[]) || []);
      }
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
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("published", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false });
        if (error) throw error;
        setProjects(data || []);
      } else {
        const { data, error } = await supabase.rpc("get_projects_public");
        if (error) throw error;
        setProjects((data as Project[]) || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get project by ID
  const getProject = useCallback(async (id: string): Promise<Project | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase.rpc("get_project_by_id_public", { p_id: id });
      if (error) throw error;
      const rows = data as Project[] | null;
      return rows?.[0] ?? null;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  // Create project
  const createProject = useCallback(async (project: ProjectInsert): Promise<Project | null> => {
    try {
      devLog('🔄 useProjects: createProject called with:', project);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        devLog('❌ useProjects: No Supabase session — cannot create project');
        setError('Sign in with Supabase to create projects');
        return null;
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

  // Duplicate an existing project into a new draft row (deep copy of case-study content).
  const duplicateProject = useCallback(async (id: string): Promise<Project | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        devLog('❌ useProjects: No Supabase session — cannot duplicate project');
        setError('Sign in with Supabase to duplicate projects');
        return null;
      }

      const ownerId = getPortfolioOwnerUserId(user.id);

      // Prefer the in-memory full row; fall back to a direct fetch.
      let source = projects.find(p => p.id === id);
      if (!source) {
        const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
        if (error) throw error;
        source = data as Project;
      }
      if (!source) {
        setError('Project to duplicate was not found');
        return null;
      }

      // Slugs are derived from the title, so keep the copy's title unique.
      const existingTitles = new Set(projects.map(p => p.title));
      let title = `${source.title} (Copy)`;
      let copyIndex = 2;
      while (existingTitles.has(title)) {
        title = `${source.title} (Copy ${copyIndex})`;
        copyIndex += 1;
      }

      const deepClone = <T,>(value: T): T =>
        value == null ? value : JSON.parse(JSON.stringify(value));

      // Regenerate client-side ids inside JSONB media arrays so they stay independent.
      const regenIds = (arr?: any[]) =>
        Array.isArray(arr)
          ? arr.map(item =>
              item && typeof item === 'object' && 'id' in item
                ? { ...item, id: Math.random().toString(36).substr(2, 9) }
                : item
            )
          : (arr ?? []);

      const maxSortOrder = projects.reduce(
        (max, project) => Math.max(max, project.sort_order ?? 0),
        -1
      );

      const payload: ProjectInsert = {
        user_id: ownerId,
        title,
        description: source.description,
        url: source.url,
        position_x: Math.min(95, (source.position_x ?? 50) + 3),
        position_y: Math.min(95, (source.position_y ?? 50) + 3),
        scale: source.scale,
        hero_scale: source.hero_scale ?? null,
        hero_position_x: source.hero_position_x ?? null,
        hero_position_y: source.hero_position_y ?? null,
        published: false, // copies start as drafts so they aren't published accidentally
        requires_password: source.requires_password,
        password: source.password,
        case_study_content: source.case_study_content,
        case_study_images: regenIds(deepClone(source.case_study_images)),
        flow_diagram_images: regenIds(deepClone(source.flow_diagram_images)),
        video_items: regenIds(deepClone(source.video_items)),
        gallery_aspect_ratio: source.gallery_aspect_ratio,
        flow_diagram_aspect_ratio: source.flow_diagram_aspect_ratio,
        video_aspect_ratio: source.video_aspect_ratio,
        gallery_columns: source.gallery_columns,
        flow_diagram_columns: source.flow_diagram_columns,
        video_columns: source.video_columns,
        key_features_columns: source.key_features_columns,
        project_images_position: source.project_images_position,
        videos_position: source.videos_position,
        flow_diagrams_position: source.flow_diagrams_position,
        solution_cards_position: source.solution_cards_position,
        section_positions: deepClone(source.section_positions),
        sort_order: maxSortOrder + 1,
        project_type: source.project_type,
        case_study_decorative_icons: source.case_study_decorative_icons,
        case_study_sidebars: deepClone(
          source.case_study_sidebars ?? (source as { caseStudySidebars?: Record<string, unknown> }).caseStudySidebars
        ),
        case_study_sections: deepClone(
          (source as { case_study_sections?: unknown[] }).case_study_sections ??
            (source as { caseStudySections?: unknown[] }).caseStudySections ??
            []
        ),
      };

      const { data, error } = await supabase
        .from('projects')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;

      try {
        await copyCaseStudySEO(id, data.id, title);
      } catch (seoErr) {
        console.warn('⚠️ useProjects: case study SEO copy failed (project was still duplicated):', seoErr);
      }

      setProjects(prev => [...prev, data].sort((a, b) => a.sort_order - b.sort_order));
      return data;
    } catch (err: any) {
      console.error('❌ useProjects: duplicateProject error:', err);
      setError(err.message);
      return null;
    }
  }, [projects]);

  // Update project
  const updateProject = useCallback(async (id: string, updates: ProjectUpdate): Promise<Project | null> => {
    try {
      devLog('🔄 useProjects: updateProject called with:', { id, updates });

      if (updates.case_study_content && updates.case_study_content.length > 100000) {
        devLog('⚠️ Large content detected, truncating to prevent timeout...');
        updates.case_study_content = updates.case_study_content.substring(0, 100000) + '\n\n... [Content truncated to prevent timeout]';
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        devLog('❌ useProjects: No Supabase session — save skipped (caller may persist locally)');
        return null;
      }

      devLog('🔄 useProjects: updating project in Supabase:', { id });

      const userId = getPortfolioOwnerUserId(user.id);
      devLog('🔄 useProjects: owner id:', userId);
      
      // Filter to valid DB columns only and drop undefined
      const allowedKeys: (keyof ProjectUpdate)[] = [
        'title','description','url','position_x','position_y','scale',
        'hero_scale','hero_position_x','hero_position_y',
        'published','requires_password','password',
        'case_study_content','case_study_images','flow_diagram_images','video_items','gallery_aspect_ratio',
        'flow_diagram_aspect_ratio','video_aspect_ratio','gallery_columns','flow_diagram_columns','video_columns','key_features_columns',
        'project_images_position','videos_position','flow_diagrams_position','solution_cards_position','section_positions','sort_order','project_type',
        'case_study_decorative_icons', 'case_study_sections'
      ];
      const payload: Record<string, any> = {};
      for (const key of allowedKeys) {
        const value = (updates as any)[key];
        // Include the value if it's not undefined (null is valid and should be included)
        if (value !== undefined) payload[key as string] = value;
      }
      // Explicitly handle project_type (allow null)
      if ('project_type' in updates) {
        payload['project_type'] = (updates as any).project_type;
      }
      // Pass JSON sidebars if present under snake_case key
      const sidebars = (updates as any).case_study_sidebars || (updates as any).caseStudySidebars;
      if (sidebars !== undefined) payload['case_study_sidebars'] = sidebars;

      console.log('🛰️ useProjects: filtered payload keys:', Object.keys(payload));
      console.log('🛰️ useProjects: filtered payload:', JSON.stringify(payload, null, 2));
      console.log('🛰️ useProjects: project_type in payload?', 'project_type' in payload, 'value:', payload['project_type']);
      console.log('🛰️ useProjects: updates.project_type:', (updates as any).project_type, 'type:', typeof (updates as any).project_type);

      let { data, error } = await Promise.race([
        supabase
          .from('projects')
          .update(payload)
          .eq('id', id)
          .select()
          .single(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Update timeout')), 30000)
        )
      ]) as any;
      
      console.log('🔄 useProjects: Supabase update result:', { 
        data: data ? { id: data.id, title: data.title, project_type: (data as any).project_type } : null, 
        error 
      });
      
      // Log detailed error information for debugging
      if (error) {
        console.error('❌ useProjects: Detailed Supabase error:');
        console.error('  Error code:', error.code);
        console.error('  Error message:', error.message);
        console.error('  Error details:', error.details);
        console.error('  Error hint:', error.hint);
        console.error('  Full error object:', JSON.stringify(error, null, 2));
        console.error('  Payload that was sent:', JSON.stringify(payload, null, 2));
        
        // Also log individual payload keys to check for issues
        console.error('  Payload keys:', Object.keys(payload));
        for (const [key, value] of Object.entries(payload)) {
          try {
            JSON.stringify(value);
          } catch (e) {
            console.error(`  ⚠️ Payload key "${key}" contains non-serializable data:`, e);
          }
        }
      }

      // If that fails due to user mismatch, try to transfer ownership
      if (error && error.code === 'PGRST116') {
        console.log('🔄 Project ownership mismatch detected, attempting to transfer ownership...');
        
        // Get the current user or use fallback
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const fallbackUserId = getPortfolioOwnerUserId(currentUser?.id);
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
      console.log('🔄 Reordering projects:', projectIds.length, 'projects');
      
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
    duplicateProject,
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

