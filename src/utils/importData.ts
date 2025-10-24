import { supabase } from '../lib/supabaseClient';

export interface ImportData {
  profiles?: any[];
  projects?: any[];
  contactMessages?: any[];
  seoData?: any[];
  pageVisibility?: any[];
  appSettings?: any[];
}

export async function importDataToSupabase(data: ImportData) {
  const results = {
    profiles: 0,
    projects: 0,
    contactMessages: 0,
    seoData: 0,
    pageVisibility: 0,
    appSettings: 0,
    errors: [] as string[]
  };

  try {
    // Import profiles
    if (data.profiles && data.profiles.length > 0) {
      console.log('📥 Importing profiles...');
      const { error } = await supabase
        .from('profiles')
        .insert(data.profiles);
      
      if (error) {
        results.errors.push(`Profiles: ${error.message}`);
      } else {
        results.profiles = data.profiles.length;
        console.log(`✅ Imported ${data.profiles.length} profiles`);
      }
    }

    // Import projects
    if (data.projects && data.projects.length > 0) {
      console.log('📥 Importing projects...');
      const { error } = await supabase
        .from('projects')
        .insert(data.projects);
      
      if (error) {
        results.errors.push(`Projects: ${error.message}`);
      } else {
        results.projects = data.projects.length;
        console.log(`✅ Imported ${data.projects.length} projects`);
      }
    }

    // Import contact messages
    if (data.contactMessages && data.contactMessages.length > 0) {
      console.log('📥 Importing contact messages...');
      const { error } = await supabase
        .from('contact_messages')
        .insert(data.contactMessages);
      
      if (error) {
        results.errors.push(`Contact Messages: ${error.message}`);
      } else {
        results.contactMessages = data.contactMessages.length;
        console.log(`✅ Imported ${data.contactMessages.length} contact messages`);
      }
    }


    // Import SEO data
    if (data.seoData && data.seoData.length > 0) {
      console.log('📥 Importing SEO data...');
      const { error } = await supabase
        .from('seo_data')
        .insert(data.seoData);
      
      if (error) {
        results.errors.push(`SEO Data: ${error.message}`);
      } else {
        results.seoData = data.seoData.length;
        console.log(`✅ Imported ${data.seoData.length} SEO records`);
      }
    }

    // Import page visibility
    if (data.pageVisibility && data.pageVisibility.length > 0) {
      console.log('📥 Importing page visibility...');
      const { error } = await supabase
        .from('page_visibility')
        .insert(data.pageVisibility);
      
      if (error) {
        results.errors.push(`Page Visibility: ${error.message}`);
      } else {
        results.pageVisibility = data.pageVisibility.length;
        console.log(`✅ Imported ${data.pageVisibility.length} page visibility records`);
      }
    }

    // Import app settings
    if (data.appSettings && data.appSettings.length > 0) {
      console.log('📥 Importing app settings...');
      const { error } = await supabase
        .from('app_settings')
        .insert(data.appSettings);
      
      if (error) {
        results.errors.push(`App Settings: ${error.message}`);
      } else {
        results.appSettings = data.appSettings.length;
        console.log(`✅ Imported ${data.appSettings.length} app settings`);
      }
    }

    console.log('🎉 Import completed!', results);
    return results;

  } catch (error: any) {
    console.error('❌ Import failed:', error);
    results.errors.push(`General error: ${error.message}`);
    return results;
  }
}

// Helper function to import from localStorage
export async function importFromLocalStorage() {
  try {
    const data: ImportData = {};
    
    // Check for existing localStorage data
    const caseStudies = localStorage.getItem('caseStudies');
    const designProjects = localStorage.getItem('designProjects');
    const aboutData = localStorage.getItem('aboutData');
    const contactData = localStorage.getItem('contactData');
    const seoData = localStorage.getItem('seoData');
    const pageVisibility = localStorage.getItem('pageVisibility');
    const appSettings = localStorage.getItem('appSettings');

    // Parse and structure the data
    if (caseStudies) {
      const projects = JSON.parse(caseStudies);
      data.projects = projects.map((project: any, index: number) => ({
        id: `case-study-${index}`,
        title: project.title,
        description: project.description,
        content: project.content,
        url: project.url,
        position_x: project.position?.x || 0,
        position_y: project.position?.y || 0,
        type: 'case_study',
        sort_order: index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
    }

    if (designProjects) {
      const projects = JSON.parse(designProjects);
      const existingProjects = data.projects || [];
      const designProjectsData = projects.map((project: any, index: number) => ({
        id: `design-project-${index}`,
        title: project.title,
        description: project.description,
        content: project.content,
        url: project.url,
        position_x: project.position?.x || 0,
        position_y: project.position?.y || 0,
        type: 'design_project',
        sort_order: index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      data.projects = [...existingProjects, ...designProjectsData];
    }

    if (aboutData) {
      const about = JSON.parse(aboutData);
      data.profiles = [{
        id: 'default-profile',
        bio_paragraph_1: about.bioParagraph1,
        bio_paragraph_2: about.bioParagraph2,
        super_powers_title: about.superPowersTitle,
        super_powers: about.superPowers,
        highlights_title: about.highlightsTitle,
        highlights: about.highlights,
        leadership_title: about.leadershipTitle,
        leadership_items: about.leadershipItems,
        expertise_title: about.expertiseTitle,
        expertise_items: about.expertiseItems,
        how_i_use_ai_title: about.howIUseAITitle,
        how_i_use_ai_items: about.howIUseAIItems,
        process_title: about.processTitle,
        process_subheading: about.processSubheading,
        process_items: about.processItems,
        certifications_title: about.certificationsTitle,
        certifications_items: about.certificationsItems,
        tools_title: about.toolsTitle,
        tools_categories: about.toolsCategories,
        section_order: about.sectionOrder,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }];
    }


    if (seoData) {
      const seo = JSON.parse(seoData);
      data.seoData = [seo];
    }

    if (pageVisibility) {
      const visibility = JSON.parse(pageVisibility);
      data.pageVisibility = [visibility];
    }

    if (appSettings) {
      const settings = JSON.parse(appSettings);
      data.appSettings = [settings];
    }

    console.log('📦 Found localStorage data:', data);
    return await importDataToSupabase(data);

  } catch (error: any) {
    console.error('❌ Failed to import from localStorage:', error);
    return {
      profiles: 0,
      projects: 0,
      contactMessages: 0,
      seoData: 0,
      pageVisibility: 0,
      appSettings: 0,
      errors: [`localStorage import failed: ${error.message}`]
    };
  }
}

// Helper function to import from JSON file
export async function importFromJSON(jsonData: any) {
  try {
    console.log('📦 Importing from JSON data:', jsonData);
    return await importDataToSupabase(jsonData);
  } catch (error: any) {
    console.error('❌ Failed to import from JSON:', error);
    return {
      profiles: 0,
      projects: 0,
      contactMessages: 0,
      seoData: 0,
      pageVisibility: 0,
      appSettings: 0,
      errors: [`JSON import failed: ${error.message}`]
    };
  }
}
