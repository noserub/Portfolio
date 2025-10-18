import { supabase } from '../lib/supabaseClient';

export async function clearAllData() {
  try {
    console.log('🧹 Starting data cleanup...');
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('No authenticated user found');
    }

    // Clear localStorage
    console.log('🧹 Clearing localStorage...');
    const keysToRemove = [
      'caseStudies',
      'designProjects', 
      'aboutData',
      'contactData',
      'musicPlaylist',
      'visualsGallery',
      'seoData',
      'pageVisibility',
      'appSettings',
      'heroText'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`✅ Removed ${key} from localStorage`);
    });

    // Clear Supabase data
    console.log('🧹 Clearing Supabase data...');
    
    // Delete in order to respect foreign key constraints
    const tables = [
      'contact_messages',
      'music_playlist', 
      'visuals_gallery',
      'seo_data',
      'page_visibility',
      'app_settings',
      'projects',
      'profiles'
    ];

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', user.id);
        
        if (error) {
          console.log(`⚠️ Could not clear ${table}: ${error.message}`);
        } else {
          console.log(`✅ Cleared ${table}`);
        }
      } catch (err) {
        console.log(`⚠️ Error clearing ${table}:`, err);
      }
    }

    console.log('✅ Data cleanup completed!');
    return { success: true, message: 'All data cleared successfully' };

  } catch (error: any) {
    console.error('❌ Data cleanup failed:', error);
    return { success: false, error: error.message };
  }
}

export async function clearLocalStorageOnly() {
  try {
    console.log('🧹 Clearing localStorage only...');
    
    const keysToRemove = [
      'caseStudies',
      'designProjects', 
      'aboutData',
      'contactData',
      'musicPlaylist',
      'visualsGallery',
      'seoData',
      'pageVisibility',
      'appSettings',
      'heroText'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`✅ Removed ${key} from localStorage`);
    });

    console.log('✅ localStorage cleared!');
    return { success: true, message: 'localStorage cleared successfully' };

  } catch (error: any) {
    console.error('❌ localStorage cleanup failed:', error);
    return { success: false, error: error.message };
  }
}
