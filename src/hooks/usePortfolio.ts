import { useProfiles } from './useProfiles';
import { useProjects } from './useProjects';
import { useContactMessages } from './useContactMessages';
import { useMusicPlaylist } from './useMusicPlaylist';
import { useVisualsGallery } from './useVisualsGallery';
import { useSEOData } from './useSEOData';
import { usePageVisibility } from './usePageVisibility';
import { useAppSettings } from './useAppSettings';

/**
 * Comprehensive hook that combines all portfolio-related functionality
 * This provides a single interface for managing all portfolio data
 */
export function usePortfolio() {
  // Initialize all hooks
  const profiles = useProfiles();
  const projects = useProjects();
  const contactMessages = useContactMessages();
  const musicPlaylist = useMusicPlaylist();
  const visualsGallery = useVisualsGallery();
  const seoData = useSEOData();
  const pageVisibility = usePageVisibility();
  const appSettings = useAppSettings();

  // Combined loading state
  const isLoading = profiles.loading || projects.loading || contactMessages.loading || 
                   musicPlaylist.loading || visualsGallery.loading || seoData.loading || 
                   pageVisibility.loading || appSettings.loading;

  // Combined error state
  const errors = [
    profiles.error,
    projects.error,
    contactMessages.error,
    musicPlaylist.error,
    visualsGallery.error,
    seoData.error,
    pageVisibility.error,
    appSettings.error
  ].filter(Boolean);

  // Refetch all data
  const refetchAll = async () => {
    await Promise.all([
      profiles.refetch(),
      projects.refetch(),
      contactMessages.refetch(),
      musicPlaylist.refetch(),
      visualsGallery.refetch(),
      seoData.refetch(),
      pageVisibility.refetch(),
      appSettings.refetch()
    ]);
  };

  // Get current user's complete portfolio data
  const getCurrentUserPortfolio = async () => {
    try {
      const [
        profile,
        userProjects,
        userSongs,
        userImages,
        userSEO,
        userPageVisibility,
        userAppSettings
      ] = await Promise.all([
        profiles.getCurrentUserProfile(),
        projects.getCurrentUserProjects(),
        musicPlaylist.getCurrentUserSongs(),
        visualsGallery.getCurrentUserImages(),
        seoData.getCurrentUserSEOData(),
        pageVisibility.getCurrentUserPageVisibility(),
        appSettings.getCurrentUserAppSettings()
      ]);

      return {
        profile,
        projects: userProjects,
        songs: userSongs,
        images: userImages,
        seo: userSEO,
        pageVisibility: userPageVisibility,
        appSettings: userAppSettings
      };
    } catch (error) {
      console.error('Error fetching current user portfolio:', error);
      return null;
    }
  };

  // Get public portfolio data (published content only)
  const getPublicPortfolio = async () => {
    try {
      const [
        publishedProjects,
        publicSongs,
        publicImages,
        publicSEO,
        publicPageVisibility
      ] = await Promise.all([
        projects.fetchPublishedProjects(),
        musicPlaylist.fetchSongs(),
        visualsGallery.fetchImages(),
        seoData.fetchSEOData(),
        pageVisibility.fetchPageVisibility()
      ]);

      return {
        projects: publishedProjects,
        songs: publicSongs,
        images: publicImages,
        seo: publicSEO,
        pageVisibility: publicPageVisibility
      };
    } catch (error) {
      console.error('Error fetching public portfolio:', error);
      return null;
    }
  };

  // Dashboard statistics
  const getDashboardStats = () => {
    return {
      totalProjects: projects.projects.length,
      publishedProjects: projects.projects.filter(p => p.published).length,
      draftProjects: projects.projects.filter(p => !p.published).length,
      totalMessages: contactMessages.messages.length,
      unreadMessages: contactMessages.getUnreadCount(),
      totalSongs: musicPlaylist.songs.length,
      totalImages: visualsGallery.images.length,
      seoPages: seoData.getPageTypes().length
    };
  };

  // Search across all content
  const searchPortfolio = (query: string) => {
    const results = {
      projects: projects.projects.filter(p => 
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.description?.toLowerCase().includes(query.toLowerCase())
      ),
      songs: musicPlaylist.songs.filter(s => 
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.artist.toLowerCase().includes(query.toLowerCase())
      ),
      images: visualsGallery.images.filter(i => 
        i.alt.toLowerCase().includes(query.toLowerCase())
      ),
      messages: contactMessages.messages.filter(m => 
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.email.toLowerCase().includes(query.toLowerCase()) ||
        m.message.toLowerCase().includes(query.toLowerCase())
      )
    };

    return results;
  };

  return {
    // Individual hooks
    profiles,
    projects,
    contactMessages,
    musicPlaylist,
    visualsGallery,
    seoData,
    pageVisibility,
    appSettings,
    
    // Combined states
    isLoading,
    errors,
    
    // Combined actions
    refetchAll,
    getCurrentUserPortfolio,
    getPublicPortfolio,
    getDashboardStats,
    searchPortfolio
  };
}

