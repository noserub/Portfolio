// Migrate Research Insights from old **Bold** format to new ## Header format

export function migrateResearchInsights() {
  try {
    const caseStudiesData = localStorage.getItem('caseStudies');
    if (!caseStudiesData) return;

    const caseStudies = JSON.parse(caseStudiesData);
    let migrated = false;

    const updatedCaseStudies = caseStudies.map((project: any) => {
      if (!project.caseStudyContent) return project;

      // Check if Research Insights section exists and needs migration
      if (project.caseStudyContent.includes('# Research insights')) {
        const sections = project.caseStudyContent.split(/\n(?=#)/);
        
        const updatedSections = sections.map((section: string) => {
          if (!section.startsWith('# Research insights')) return section;

          // Check if this section uses old **Bold** format
          if (section.includes('\n**') && !section.includes('\n## ')) {
            console.log('🔄 Migrating Research Insights for:', project.title);
            migrated = true;

            // Extract insights from **Bold** format
            const lines = section.split('\n');
            const newLines: string[] = ['# Research insights', ''];

            let currentTitle = '';
            let currentDescription: string[] = [];

            for (let i = 1; i < lines.length; i++) {
              const line = (lines[i] || '').trim();
              
              // Skip empty lines and separators
              if (!line || line === '---') continue;

              // Check if this is a bold title
              if (line.startsWith('**') && line.endsWith('**')) {
                // Save previous insight if exists
                if (currentTitle) {
                  newLines.push(`## ${currentTitle}`);
                  newLines.push('');
                  if (currentDescription.length > 0) {
                    newLines.push(currentDescription.join(' '));
                    newLines.push('');
                  }
                }
                // Start new insight
                currentTitle = (line || '').replace(/^\*\*/, '').replace(/\*\*$/, '');
                currentDescription = [];
              } else if (line) {
                // This is description text
                currentDescription.push(line);
              }
            }

            // Save last insight
            if (currentTitle) {
              newLines.push(`## ${currentTitle}`);
              newLines.push('');
              if (currentDescription.length > 0) {
                newLines.push(currentDescription.join(' '));
              }
            }

            return newLines.join('\n');
          }

          return section;
        });

        return {
          ...project,
          caseStudyContent: updatedSections.join('\n')
        };
      }

      return project;
    });

    if (migrated) {
      localStorage.setItem('caseStudies', JSON.stringify(updatedCaseStudies));
      console.log('✅ Research Insights migration completed');
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}
