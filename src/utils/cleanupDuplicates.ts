import { supabase } from '../lib/supabaseClient';

export async function cleanupDuplicateProjects() {
  try {
    console.log('🧹 Starting duplicate cleanup...');
    
    // Get all projects
    const { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Error fetching projects:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${projects?.length || 0} total projects`);
    
    // Group by title
    const titleGroups: { [title: string]: any[] } = {};
    projects?.forEach(project => {
      if (!titleGroups[project.title]) {
        titleGroups[project.title] = [];
      }
      titleGroups[project.title].push(project);
    });
    
    // Find duplicates
    const duplicates = Object.entries(titleGroups).filter(([title, projects]) => projects.length > 1);
    
    console.log(`🔍 Found ${duplicates.length} duplicate groups:`, duplicates.map(([title, projs]) => `${title} (${projs.length})`));
    
    // For each duplicate group, keep the most recent one and delete the rest
    for (const [title, duplicateProjects] of duplicates) {
      console.log(`🔄 Processing duplicates for: ${title}`);
      
      // Sort by updated_at (most recent first)
      const sorted = duplicateProjects.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      
      const keepProject = sorted[0];
      const deleteProjects = sorted.slice(1);
      
      console.log(`✅ Keeping: ${keepProject.id} (${keepProject.updated_at})`);
      console.log(`🗑️ Deleting: ${deleteProjects.map(p => `${p.id} (${p.updated_at})`).join(', ')}`);
      
      // Delete the older duplicates
      for (const project of deleteProjects) {
        const { error: deleteError } = await supabase
          .from('projects')
          .delete()
          .eq('id', project.id);
        
        if (deleteError) {
          console.error(`❌ Error deleting project ${project.id}:`, deleteError);
        } else {
          console.log(`✅ Deleted project ${project.id}`);
        }
      }
    }
    
    console.log('🎉 Duplicate cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Function to run cleanup from browser console
(window as any).cleanupDuplicates = cleanupDuplicateProjects;
