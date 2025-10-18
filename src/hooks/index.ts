// Export all custom hooks
export { useSEO } from './useSEO';
export { useLocalStorage } from './useLocalStorage';
export { useIntersectionObserver } from './useIntersectionObserver';
export { useDebounce } from './useDebounce';

// Export all Supabase CRUD hooks
export { useProfiles } from './useProfiles';
export { useProjects } from './useProjects';
export { useContactMessages } from './useContactMessages';
export { useMusicPlaylist } from './useMusicPlaylist';
export { useVisualsGallery } from './useVisualsGallery';
export { useSEOData } from './useSEOData';
export { usePageVisibility } from './usePageVisibility';
export { useAppSettings } from './useAppSettings';

// Export comprehensive portfolio hook
export { usePortfolio } from './usePortfolio';

// Export types
export type { Profile, ProfileInsert, ProfileUpdate } from './useProfiles';
export type { Project, ProjectInsert, ProjectUpdate } from './useProjects';
export type { ContactMessage, ContactMessageInsert, ContactMessageUpdate } from './useContactMessages';
export type { Song, SongInsert, SongUpdate } from './useMusicPlaylist';
export type { GalleryImage, GalleryImageInsert, GalleryImageUpdate } from './useVisualsGallery';
export type { SEOData, SEODataInsert, SEODataUpdate } from './useSEOData';
export type { PageVisibility, PageVisibilityInsert, PageVisibilityUpdate } from './usePageVisibility';
export type { AppSettings, AppSettingsInsert, AppSettingsUpdate } from './useAppSettings';