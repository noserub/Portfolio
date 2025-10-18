import { ProjectData } from '../components/ProjectImage';

/**
 * Migration utility to ensure all projects have video-related fields
 * This handles backward compatibility when new fields are added
 */
export function migrateVideoFields(project: ProjectData): ProjectData {
  return {
    ...project,
    videoItems: project.videoItems || [],
    videoAspectRatio: project.videoAspectRatio || '16x9',
    videoColumns: project.videoColumns || 1,
    videosPosition: project.videosPosition ?? 998, // Default: before flow diagrams
  };
}

/**
 * Migrate an array of projects
 */
export function migrateProjectsArray(projects: ProjectData[]): ProjectData[] {
  if (!Array.isArray(projects)) {
    console.error('❌ migrateProjectsArray: Input is not an array');
    return [];
  }
  
  return projects.map(project => migrateVideoFields(project));
}

/**
 * Load and migrate projects from localStorage
 */
export function loadMigratedProjects(key: string, defaults: ProjectData[]): ProjectData[] {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) {
      console.log(`📝 No saved ${key}, using defaults`);
      return migrateProjectsArray(defaults);
    }
    
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      console.error(`❌ ${key} is not an array, using defaults`);
      localStorage.removeItem(key);
      return migrateProjectsArray(defaults);
    }
    
    const migrated = migrateProjectsArray(parsed);
    console.log(`✅ Loaded and migrated ${migrated.length} projects from ${key}`);
    return migrated;
  } catch (e) {
    console.error(`❌ Error loading ${key}:`, e);
    try {
      localStorage.removeItem(key);
    } catch (clearError) {
      console.error(`Cannot clear ${key}:`, clearError);
    }
    return migrateProjectsArray(defaults);
  }
}
