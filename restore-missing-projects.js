// Restore missing case studies
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');
const fs = require('fs');

const supabase = createClient('https://ljapwsajftxltykmpsmz.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqYXB3c2FqZnR4bHR5a21wc216Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MTA5MTcsImV4cCI6MjA3NjI4NjkxN30.TQiwD1hKTIaZClOidmoKqAAUV9Bs2YkLM1JDpw5bQK8');

async function restoreMissingProjects() {
  try {
    // Load the backup data
    const backupData = JSON.parse(fs.readFileSync('portfolio-backup-placeholder-2025-10-17T18-02-15.json', 'utf8'));
    const caseStudies = JSON.parse(backupData.caseStudies);
    console.log('Loaded backup data with', caseStudies.length, 'case studies');

    // Find the missing projects
    const skypeProject = caseStudies.find(p => p.title === 'Skype Qik case study');
    const tandemProject = caseStudies.find(p => p.title === 'Tandem Diabetes Care');

    console.log('Found Skype project:', skypeProject ? 'Yes' : 'No');
    console.log('Found Tandem project:', tandemProject ? 'Yes' : 'No');

    // Restore Skype Qik case study
    if (skypeProject) {
      console.log('\nRestoring Skype Qik case study...');
      const skypeData = {
        id: randomUUID(),
        user_id: '7cd2752f-93c5-46e6-8535-32769fb10055',
        title: skypeProject.title,
        description: skypeProject.description,
        url: skypeProject.url,
        position_x: skypeProject.position?.x || skypeProject.position_x || 50,
        position_y: skypeProject.position?.y || skypeProject.position_y || 50,
        scale: skypeProject.scale || 1,
        published: true,
        requires_password: true,  // Enable password protection
        password: '0p3n',
        case_study_content: skypeProject.caseStudyContent || skypeProject.case_study_content,
        case_study_images: skypeProject.caseStudyImages || skypeProject.case_study_images || [],
        flow_diagram_images: skypeProject.flowDiagramImages || skypeProject.flow_diagram_images || [],
        video_items: skypeProject.videoItems || skypeProject.video_items || [],
        gallery_aspect_ratio: skypeProject.galleryAspectRatio || skypeProject.gallery_aspect_ratio || '3x4',
        flow_diagram_aspect_ratio: skypeProject.flowDiagramAspectRatio || skypeProject.flow_diagram_aspect_ratio || '3x4',
        video_aspect_ratio: skypeProject.videoAspectRatio || skypeProject.video_aspect_ratio || '3x4',
        gallery_columns: skypeProject.galleryColumns || skypeProject.gallery_columns || 1,
        flow_diagram_columns: skypeProject.flowDiagramColumns || skypeProject.flow_diagram_columns || 1,
        video_columns: skypeProject.videoColumns || skypeProject.video_columns || 1,
        project_images_position: skypeProject.projectImagesPosition || skypeProject.project_images_position,
        videos_position: skypeProject.videosPosition || skypeProject.videos_position,
        flow_diagrams_position: skypeProject.flowDiagramsPosition || skypeProject.flow_diagrams_position,
        solution_cards_position: skypeProject.solutionCardsPosition || skypeProject.solution_cards_position,
        section_positions: skypeProject.sectionPositions || skypeProject.section_positions || {},
        sort_order: skypeProject.sortOrder || skypeProject.sort_order || 0
      };

      const { data: skypeResult, error: skypeError } = await supabase
        .from('projects')
        .insert(skypeData)
        .select();

      if (skypeError) {
        console.error('Error restoring Skype project:', skypeError);
      } else {
        console.log('✅ Successfully restored Skype Qik case study with password protection!');
        console.log('Skype project ID:', skypeResult[0].id);
      }
    }

    // Restore Tandem Diabetes Care case study
    if (tandemProject) {
      console.log('\nRestoring Tandem Diabetes Care case study...');
      const tandemData = {
        id: randomUUID(),
        user_id: '7cd2752f-93c5-46e6-8535-32769fb10055',
        title: tandemProject.title,
        description: tandemProject.description,
        url: tandemProject.url,
        position_x: tandemProject.position?.x || tandemProject.position_x || 50,
        position_y: tandemProject.position?.y || tandemProject.position_y || 50,
        scale: tandemProject.scale || 1,
        published: true,
        requires_password: false,  // Keep this one unprotected for now
        password: '',
        case_study_content: tandemProject.caseStudyContent || tandemProject.case_study_content,
        case_study_images: tandemProject.caseStudyImages || tandemProject.case_study_images || [],
        flow_diagram_images: tandemProject.flowDiagramImages || tandemProject.flow_diagram_images || [],
        video_items: tandemProject.videoItems || tandemProject.video_items || [],
        gallery_aspect_ratio: tandemProject.galleryAspectRatio || tandemProject.gallery_aspect_ratio || '3x4',
        flow_diagram_aspect_ratio: tandemProject.flowDiagramAspectRatio || tandemProject.flow_diagram_aspect_ratio || '3x4',
        video_aspect_ratio: tandemProject.videoAspectRatio || tandemProject.video_aspect_ratio || '3x4',
        gallery_columns: tandemProject.galleryColumns || tandemProject.gallery_columns || 1,
        flow_diagram_columns: tandemProject.flowDiagramColumns || tandemProject.flow_diagram_columns || 1,
        video_columns: tandemProject.videoColumns || tandemProject.video_columns || 1,
        project_images_position: tandemProject.projectImagesPosition || tandemProject.project_images_position,
        videos_position: tandemProject.videosPosition || tandemProject.videos_position,
        flow_diagrams_position: tandemProject.flowDiagramsPosition || tandemProject.flow_diagrams_position,
        solution_cards_position: tandemProject.solutionCardsPosition || tandemProject.solution_cards_position,
        section_positions: tandemProject.sectionPositions || tandemProject.section_positions || {},
        sort_order: tandemProject.sortOrder || tandemProject.sort_order || 0
      };

      const { data: tandemResult, error: tandemError } = await supabase
        .from('projects')
        .insert(tandemData)
        .select();

      if (tandemError) {
        console.error('Error restoring Tandem project:', tandemError);
      } else {
        console.log('✅ Successfully restored Tandem Diabetes Care case study!');
        console.log('Tandem project ID:', tandemResult[0].id);
      }
    }

    // Verify all projects are restored
    const { data: finalProjects } = await supabase.from('projects').select('id, title, requires_password, password');
    console.log('\nFinal projects status:');
    finalProjects.forEach(p => console.log(`- ${p.title}: requires_password=${p.requires_password}, password=${p.password || 'none'}`));

  } catch (error) {
    console.error('Error restoring projects:', error);
  }
}

restoreMissingProjects();
