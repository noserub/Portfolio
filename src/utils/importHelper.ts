import { supabase } from '../lib/supabaseClient';

interface ImportOptions {
  overwriteExisting?: boolean;
  onProgress?: (message: string) => void;
}

// Helper to import all data types
export async function importAllData(
  jsonData: any,
  options: ImportOptions = {}
) {
  const { onProgress = console.log } = options;
  
  onProgress('📥 Starting FULL import process...');
  onProgress('🔍 Analyzing imported data...');
  onProgress(`   Keys found: ${Object.keys(jsonData).join(', ')}`);
  
  const results = {
    projects: { created: 0, updated: 0, skipped: 0, errors: [] as string[] },
    settings: { imported: false, error: null as string | null },
    profile: { imported: false, error: null as string | null },
    hero: { imported: false, error: null as string | null },
  };
  
  try {
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    const isBypassAuth = localStorage.getItem('isAuthenticated') === 'true';
    
    if (!user && !isBypassAuth) {
      throw new Error('Not authenticated. Please sign in first.');
    }
    
    const userId = user?.id || '7cd2752f-93c5-46e6-8535-32769fb10055';
    
    // 1. Import Projects
    onProgress('\n📦 Importing projects...');
    const projectResults = await importProjectsFromBackup(jsonData, { ...options, onProgress });
    results.projects = projectResults;
    
    // 2. Import App Settings (logo, favicon, etc.)
    if (jsonData.seoData || jsonData.appSettings) {
      onProgress('\n⚙️ Importing app settings...');
      try {
        const settings = jsonData.seoData || jsonData.appSettings;
        
        // Check if settings exist in Supabase
        const { data: existingSettings } = await supabase
          .from('seo_data')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        
        const settingsData = {
          user_id: userId,
          site_title: settings.site_title || settings.siteTitle,
          site_description: settings.site_description || settings.siteDescription,
          logo_image: settings.logo_image || settings.logoImage,
          logo_dark_image: settings.logo_dark_image || settings.logoDarkImage,
          favicon_image: settings.favicon_image || settings.faviconImage,
          og_image: settings.og_image || settings.ogImage,
          twitter_handle: settings.twitter_handle || settings.twitterHandle,
        };
        
        if (existingSettings) {
          await supabase
            .from('seo_data')
            .update(settingsData)
            .eq('id', existingSettings.id);
          onProgress('✅ Updated app settings');
        } else {
          await supabase
            .from('seo_data')
            .insert(settingsData);
          onProgress('✨ Created app settings');
        }
        
        results.settings.imported = true;
      } catch (error: any) {
        results.settings.error = error.message;
        onProgress(`❌ Error importing settings: ${error.message}`);
      }
    }
    
    // 3. Import About/Profile Data
    if (jsonData.aboutPageProfile) {
      onProgress('\n👤 Importing profile data...');
      try {
        const profile = jsonData.aboutPageProfile;
        
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        
        const profileData = {
          user_id: userId,
          bio_paragraph_1: profile.bio_paragraph_1,
          bio_paragraph_2: profile.bio_paragraph_2,
          super_powers_title: profile.super_powers_title,
          super_powers: profile.super_powers,
          highlights_title: profile.highlights_title,
          highlights: profile.highlights,
          leadership_title: profile.leadership_title,
          leadership_items: profile.leadership_items,
          expertise_title: profile.expertise_title,
          expertise_items: profile.expertise_items,
          how_i_use_ai_title: profile.how_i_use_ai_title,
          how_i_use_ai_items: profile.how_i_use_ai_items,
          process_title: profile.process_title,
          process_subheading: profile.process_subheading,
          process_items: profile.process_items,
          tools_title: profile.tools_title,
          tools_categories: profile.tools_categories,
          section_order: profile.section_order,
        };
        
        if (existingProfile) {
          await supabase
            .from('profiles')
            .update(profileData)
            .eq('id', existingProfile.id);
          onProgress('✅ Updated profile');
        } else {
          await supabase
            .from('profiles')
            .insert(profileData);
          onProgress('✨ Created profile');
        }
        
        results.profile.imported = true;
      } catch (error: any) {
        results.profile.error = error.message;
        onProgress(`❌ Error importing profile: ${error.message}`);
      }
    }
    
    // 4. Import Hero Text
    if (jsonData.heroText) {
      onProgress('\n🎭 Importing hero text...');
      try {
        localStorage.setItem('heroText', JSON.stringify(jsonData.heroText));
        onProgress('✅ Updated hero text');
        results.hero.imported = true;
      } catch (error: any) {
        results.hero.error = error.message;
        onProgress(`❌ Error importing hero text: ${error.message}`);
      }
    }
    
    // 5. Import Contact Page Content
    if (jsonData.contactPageContent) {
      onProgress('\n📧 Importing contact page content...');
      try {
        localStorage.setItem('contactPageContent', JSON.stringify(jsonData.contactPageContent));
        onProgress('✅ Updated contact page content');
      } catch (error: any) {
        onProgress(`❌ Error importing contact page: ${error.message}`);
      }
    }
    
    // Summary
    onProgress('\n\n📊 Import Summary:');
    onProgress('Projects:');
    onProgress(`   ✨ Created: ${results.projects.created}`);
    onProgress(`   ✅ Updated: ${results.projects.updated}`);
    onProgress(`   ⏭️ Skipped: ${results.projects.skipped}`);
    onProgress(`   ❌ Errors: ${results.projects.errors.length}`);
    onProgress(`Settings: ${results.settings.imported ? '✅ Imported' : '❌ Not imported'}`);
    onProgress(`Profile: ${results.profile.imported ? '✅ Imported' : '❌ Not imported'}`);
    onProgress(`Hero Text: ${results.hero.imported ? '✅ Imported' : '❌ Not imported'}`);
    
    return results;
  } catch (error: any) {
    onProgress(`❌ Fatal error: ${error.message}`);
    throw error;
  }
}

export async function importProjectsFromBackup(
  jsonData: any,
  options: ImportOptions = {}
) {
  const { overwriteExisting = false, onProgress = console.log } = options;
  
  onProgress('📥 Starting import process...');
  onProgress('🔍 Analyzing imported data...');
  onProgress(`   Keys found: ${Object.keys(jsonData).join(', ')}`);
  
  const results = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[],
  };
  
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    const isBypassAuth = localStorage.getItem('isAuthenticated') === 'true';
    
    if (!user && !isBypassAuth) {
      throw new Error('Not authenticated. Please sign in first.');
    }
    
    const userId = user?.id || '7cd2752f-93c5-46e6-8535-32769fb10055'; // Use current user or fallback
    
    // Import case studies
    if (jsonData.caseStudies && Array.isArray(jsonData.caseStudies)) {
      onProgress(`📚 Found ${jsonData.caseStudies.length} case studies to import`);
      
      for (const project of jsonData.caseStudies) {
        try {
          onProgress(`🔍 Processing: ${project.title}`);
          
          // Check if project already exists
          const { data: existing, error: searchError } = await supabase
            .from('projects')
            .select('id, updated_at')
            .eq('title', project.title)
            .maybeSingle();
          
          if (searchError) {
            throw searchError;
          }
          
          // Prepare project data
          const projectData = {
            user_id: userId,
            title: project.title,
            description: project.description,
            url: project.url,
            position_x: project.position?.x || project.position_x || 50,
            position_y: project.position?.y || project.position_y || 50,
            scale: project.scale || 1,
            published: project.published !== false,
            requires_password: project.requires_password || project.requiresPassword || false,
            password: project.password || '',
            case_study_content: project.case_study_content || project.caseStudyContent || '',
            case_study_images: project.case_study_images || project.caseStudyImages || [],
            flow_diagram_images: project.flow_diagram_images || project.flowDiagramImages || [],
            video_items: project.video_items || project.videoItems || [],
            gallery_aspect_ratio: project.gallery_aspect_ratio || project.galleryAspectRatio || '3x4',
            flow_diagram_aspect_ratio: project.flow_diagram_aspect_ratio || project.flowDiagramAspectRatio || '3x4',
            video_aspect_ratio: project.video_aspect_ratio || project.videoAspectRatio || '3x4',
            gallery_columns: project.gallery_columns || project.galleryColumns || 1,
            flow_diagram_columns: project.flow_diagram_columns || project.flowDiagramColumns || 1,
            video_columns: project.video_columns || project.videoColumns || 1,
            project_images_position: project.project_images_position || project.projectImagesPosition || null,
            videos_position: project.videos_position || project.videosPosition || null,
            flow_diagrams_position: project.flow_diagrams_position || project.flowDiagramsPosition || null,
            solution_cards_position: project.solution_cards_position || project.solutionCardsPosition || null,
            section_positions: project.section_positions || project.sectionPositions || {},
            sort_order: project.sort_order || project.sortOrder || 0,
          };
          
          if (existing) {
            if (overwriteExisting) {
              // Update existing project
              onProgress(`   📝 Updating existing project (ID: ${existing.id})...`);
              const { error: updateError } = await supabase
                .from('projects')
                .update(projectData)
                .eq('id', existing.id);
              
              if (updateError) {
                throw updateError;
              }
              
              onProgress(`✅ Updated: ${project.title}`);
              results.updated++;
            } else {
              onProgress(`⏭️ Skipped (already exists): ${project.title}`);
              results.skipped++;
            }
          } else {
            // Create new project
            onProgress(`   ✨ Creating new project...`);
            const { error: insertError } = await supabase
              .from('projects')
              .insert(projectData);
            
            if (insertError) {
              throw insertError;
            }
            
            onProgress(`✨ Created: ${project.title}`);
            results.created++;
          }
        } catch (error: any) {
          const errorMsg = `Error with ${project.title}: ${error.message}`;
          onProgress(`❌ ${errorMsg}`);
          results.errors.push(errorMsg);
        }
      }
    }
    
    // Import design projects
    if (jsonData.designProjects && Array.isArray(jsonData.designProjects)) {
      onProgress(`🎨 Found ${jsonData.designProjects.length} design projects to import`);
      
      for (const project of jsonData.designProjects) {
        try {
          onProgress(`🔍 Processing: ${project.title}`);
          
          const { data: existing, error: searchError } = await supabase
            .from('projects')
            .select('id, updated_at')
            .eq('title', project.title)
            .maybeSingle();
          
          if (searchError) {
            throw searchError;
          }
          
          const projectData = {
            user_id: userId,
            title: project.title,
            description: project.description,
            url: project.url,
            position_x: project.position?.x || project.position_x || 50,
            position_y: project.position?.y || project.position_y || 50,
            scale: project.scale || 1,
            published: project.published !== false,
            sort_order: project.sort_order || project.sortOrder || 0,
          };
          
          if (existing) {
            if (overwriteExisting) {
              const { error: updateError } = await supabase
                .from('projects')
                .update(projectData)
                .eq('id', existing.id);
              
              if (updateError) {
                throw updateError;
              }
              
              onProgress(`✅ Updated: ${project.title}`);
              results.updated++;
            } else {
              onProgress(`⏭️ Skipped (already exists): ${project.title}`);
              results.skipped++;
            }
          } else {
            const { error: insertError } = await supabase
              .from('projects')
              .insert(projectData);
            
            if (insertError) {
              throw insertError;
            }
            
            onProgress(`✨ Created: ${project.title}`);
            results.created++;
          }
        } catch (error: any) {
          const errorMsg = `Error with ${project.title}: ${error.message}`;
          onProgress(`❌ ${errorMsg}`);
          results.errors.push(errorMsg);
        }
      }
    }
    
    onProgress('\n📊 Import Summary:');
    onProgress(`   ✨ Created: ${results.created}`);
    onProgress(`   ✅ Updated: ${results.updated}`);
    onProgress(`   ⏭️ Skipped: ${results.skipped}`);
    onProgress(`   ❌ Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      onProgress('\n❌ Errors:');
      results.errors.forEach(err => onProgress(`   - ${err}`));
    }
    
    return results;
  } catch (error: any) {
    onProgress(`❌ Fatal error: ${error.message}`);
    throw error;
  }
}

// Make it available globally for console use
if (typeof window !== 'undefined') {
  (window as any).importProjectsFromBackup = importProjectsFromBackup;
}

