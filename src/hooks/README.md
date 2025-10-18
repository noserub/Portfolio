# Portfolio Hooks Documentation

This directory contains comprehensive React hooks for managing your portfolio data with Supabase. Each hook provides CRUD operations for specific database tables.

## Available Hooks

### Core Hooks
- `useProfiles` - Manage user profiles
- `useProjects` - Manage portfolio projects/case studies
- `useContactMessages` - Manage contact form submissions
- `useMusicPlaylist` - Manage music tracks
- `useVisualsGallery` - Manage visual gallery images
- `useSEOData` - Manage SEO metadata
- `usePageVisibility` - Manage page visibility settings
- `useAppSettings` - Manage application settings

### Comprehensive Hook
- `usePortfolio` - Combines all hooks for complete portfolio management

## Usage Examples

### Basic Usage

```typescript
import { useProjects, useProfiles } from '../hooks';

function ProjectsPage() {
  const { projects, loading, error, createProject, updateProject, deleteProject } = useProjects();
  const { getCurrentUserProfile } = useProfiles();

  // Your component logic here
}
```

### Comprehensive Portfolio Management

```typescript
import { usePortfolio } from '../hooks';

function Dashboard() {
  const {
    profiles,
    projects,
    contactMessages,
    musicPlaylist,
    visualsGallery,
    seoData,
    pageVisibility,
    appSettings,
    isLoading,
    getCurrentUserPortfolio,
    getPublicPortfolio,
    getDashboardStats,
    searchPortfolio
  } = usePortfolio();

  // Use any of the individual hooks or combined functionality
}
```

### Individual Hook Examples

#### Projects Hook
```typescript
import { useProjects } from '../hooks';

function ProjectsManager() {
  const {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    reorderProjects,
    getCurrentUserProjects
  } = useProjects();

  const handleCreateProject = async () => {
    const newProject = await createProject({
      user_id: 'user-id',
      title: 'New Project',
      description: 'Project description',
      published: false
    });
  };

  const handleUpdateProject = async (id: string) => {
    await updateProject(id, {
      title: 'Updated Title',
      published: true
    });
  };

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {projects.map(project => (
        <div key={project.id}>
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          <button onClick={() => handleUpdateProject(project.id)}>
            Update
          </button>
        </div>
      ))}
    </div>
  );
}
```

#### Contact Messages Hook
```typescript
import { useContactMessages } from '../hooks';

function ContactManager() {
  const {
    messages,
    loading,
    error,
    createMessage,
    markAsRead,
    getUnreadCount
  } = useContactMessages();

  const unreadCount = getUnreadCount();

  return (
    <div>
      <h2>Contact Messages ({unreadCount} unread)</h2>
      {messages.map(message => (
        <div key={message.id} className={message.is_read ? 'read' : 'unread'}>
          <h3>{message.name}</h3>
          <p>{message.email}</p>
          <p>{message.message}</p>
          {!message.is_read && (
            <button onClick={() => markAsRead(message.id)}>
              Mark as Read
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

#### SEO Data Hook
```typescript
import { useSEOData } from '../hooks';

function SEOManager() {
  const {
    seoData,
    loading,
    error,
    getSEODataByPageType,
    updateSEODataByPageType
  } = useSEOData();

  const handleUpdateHomeSEO = async () => {
    await updateSEODataByPageType('home', {
      title: 'New Home Title',
      description: 'New home description',
      keywords: 'portfolio, design, ux'
    });
  };

  return (
    <div>
      {seoData.map(seo => (
        <div key={seo.id}>
          <h3>{seo.page_type}</h3>
          <p>Title: {seo.title}</p>
          <p>Description: {seo.description}</p>
        </div>
      ))}
    </div>
  );
}
```

## Hook Features

### Common Features (All Hooks)
- **Loading states** - Track async operations
- **Error handling** - Comprehensive error management
- **Local state updates** - Optimistic updates for better UX
- **Refetch functionality** - Manual data refresh
- **TypeScript support** - Full type safety

### Specialized Features
- **Reordering** - Projects, songs, and images can be reordered
- **User-specific data** - Get current user's data
- **Public/private data** - Separate published and draft content
- **Search functionality** - Search across all content types
- **Dashboard statistics** - Get overview of all data

## Error Handling

All hooks provide error handling with the `error` state:

```typescript
const { error, loading } = useProjects();

if (error) {
  console.error('Error:', error);
  // Handle error appropriately
}
```

## Loading States

```typescript
const { loading } = useProjects();

if (loading) {
  return <div>Loading...</div>;
}
```

## TypeScript Support

All hooks are fully typed with TypeScript interfaces:

```typescript
import { Project, ProjectInsert, ProjectUpdate } from '../hooks';

const project: Project = {
  id: 'uuid',
  title: 'My Project',
  // ... other properties
};

const newProject: ProjectInsert = {
  user_id: 'user-id',
  title: 'New Project'
};
```

## Best Practices

1. **Use the comprehensive hook** for dashboard/admin pages
2. **Use individual hooks** for specific features
3. **Handle loading and error states** appropriately
4. **Use TypeScript** for better development experience
5. **Implement optimistic updates** for better UX
6. **Use the search functionality** for content discovery

## Database Schema

These hooks work with the following database tables:
- `profiles` - User profiles
- `projects` - Portfolio projects
- `contact_messages` - Contact form submissions
- `music_playlist` - Music tracks
- `visuals_gallery` - Visual gallery images
- `seo_data` - SEO metadata
- `page_visibility` - Page visibility settings
- `app_settings` - Application settings

All tables include Row Level Security (RLS) policies for data protection.

