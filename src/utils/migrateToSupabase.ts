import { supabase } from '../lib/supabaseClient';

export interface LocalStorageProject {
  id: string;
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

export async function migrateLocalStorageToSupabase() {
  try {
    console.log('🚀 Starting migration from localStorage to Supabase...');
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ No authenticated user found. Please sign in first.');
      return { success: false, error: 'No authenticated user' };
    }

    console.log('✅ User authenticated:', user.email);

    // Get localStorage data
    const caseStudiesData = localStorage.getItem('caseStudies');
    const designProjectsData = localStorage.getItem('designProjects');
    
    if (!caseStudiesData && !designProjectsData) {
      console.log('ℹ️ No localStorage data found to migrate.');
      return { success: true, message: 'No data to migrate' };
    }

    let migratedCount = 0;
    const errors: string[] = [];

    // Migrate case studies
    if (caseStudiesData) {
      try {
        const caseStudies: LocalStorageProject[] = JSON.parse(caseStudiesData);
        console.log(`📦 Found ${caseStudies.length} case studies to migrate`);
        
        for (const project of caseStudies) {
          const projectData = {
            user_id: user.id,
            title: project.title,
            description: project.description,
            url: project.url,
            position_x: project.position_x || 50,
            position_y: project.position_y || 50,
            scale: project.scale || 1,
            published: project.published || false,
            requires_password: project.requires_password || false,
            password: project.password,
            case_study_content: project.case_study_content,
            case_study_images: project.case_study_images || [],
            flow_diagram_images: project.flow_diagram_images || [],
            video_items: project.video_items || [],
            gallery_aspect_ratio: project.gallery_aspect_ratio || '3x4',
            flow_diagram_aspect_ratio: project.flow_diagram_aspect_ratio || '3x4',
            video_aspect_ratio: project.video_aspect_ratio || '3x4',
            gallery_columns: project.gallery_columns || 1,
            flow_diagram_columns: project.flow_diagram_columns || 1,
            video_columns: project.video_columns || 1,
            project_images_position: project.project_images_position,
            videos_position: project.videos_position,
            flow_diagrams_position: project.flow_diagrams_position,
            solution_cards_position: project.solution_cards_position,
            section_positions: project.section_positions || {},
            sort_order: project.sort_order || 0
          };

          const { error } = await supabase
            .from('projects')
            .insert(projectData);

          if (error) {
            console.error(`❌ Failed to migrate project "${project.title}":`, error);
            errors.push(`Failed to migrate "${project.title}": ${error.message}`);
          } else {
            console.log(`✅ Migrated project: ${project.title}`);
            migratedCount++;
          }
        }
      } catch (error) {
        console.error('❌ Error parsing case studies:', error);
        errors.push('Error parsing case studies data');
      }
    }

    // Migrate design projects
    if (designProjectsData) {
      try {
        const designProjects: LocalStorageProject[] = JSON.parse(designProjectsData);
        console.log(`📦 Found ${designProjects.length} design projects to migrate`);
        
        for (const project of designProjects) {
          const projectData = {
            user_id: user.id,
            title: project.title,
            description: project.description,
            url: project.url,
            position_x: project.position_x || 50,
            position_y: project.position_y || 50,
            scale: project.scale || 1,
            published: project.published || false,
            requires_password: project.requires_password || false,
            password: project.password,
            case_study_content: project.case_study_content,
            case_study_images: project.case_study_images || [],
            flow_diagram_images: project.flow_diagram_images || [],
            video_items: project.video_items || [],
            gallery_aspect_ratio: project.gallery_aspect_ratio || '3x4',
            flow_diagram_aspect_ratio: project.flow_diagram_aspect_ratio || '3x4',
            video_aspect_ratio: project.video_aspect_ratio || '3x4',
            gallery_columns: project.gallery_columns || 1,
            flow_diagram_columns: project.flow_diagram_columns || 1,
            video_columns: project.video_columns || 1,
            project_images_position: project.project_images_position,
            videos_position: project.videos_position,
            flow_diagrams_position: project.flow_diagrams_position,
            solution_cards_position: project.solution_cards_position,
            section_positions: project.section_positions || {},
            sort_order: project.sort_order || 0
          };

          const { error } = await supabase
            .from('projects')
            .insert(projectData);

          if (error) {
            console.error(`❌ Failed to migrate project "${project.title}":`, error);
            errors.push(`Failed to migrate "${project.title}": ${error.message}`);
          } else {
            console.log(`✅ Migrated project: ${project.title}`);
            migratedCount++;
          }
        }
      } catch (error) {
        console.error('❌ Error parsing design projects:', error);
        errors.push('Error parsing design projects data');
      }
    }

    console.log(`🎉 Migration complete! Migrated ${migratedCount} projects.`);
    
    if (errors.length > 0) {
      console.warn('⚠️ Some errors occurred during migration:', errors);
    }

    return {
      success: true,
      migratedCount,
      errors
    };

  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Add to window for easy access
if (typeof window !== 'undefined') {
  (window as any).migrateToSupabase = migrateLocalStorageToSupabase;
}
