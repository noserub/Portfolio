# Post-Figma Make Architecture Prompts Guide

## Overview
This guide provides a systematic approach to transform Figma Make exports into production-ready applications with enterprise-grade architecture. These prompts are designed to eliminate the iterative pain of poorly structured codebases by implementing best practices from the start.

## Quick Start

### For Standard Web Apps
1. Import from Figma Make
2. Run **Prompt 1: Initial Assessment**
3. Run **Prompt 2: Database Architecture**
4. Run **Prompt 3: Performance Optimization**
5. Run **Prompt 4: Production Readiness**

### For Browser Extensions
1. Import from Figma Make (UI components only)
2. Run **Prompt 5c: Browser Extension Architecture** - **FIRST**
3. Run **Prompt 1: Initial Assessment** (adapted for extensions)
4. Run **Prompt 2: Database Architecture**
5. Run **Prompt 4: Production Readiness**

## Project-Specific Sequences

### Family AI Assistant
```
1. Import from Figma Make
2. Prompt 1: Initial Assessment
3. Prompt 2: Database Architecture
4. Prompt 3: Performance Optimization
5. Prompt 5a: AI Integration
6. Prompt 5d: Real-time Features
7. Prompt 4: Production Readiness
```

### Band Website with Music Player
```
1. Import from Figma Make
2. Prompt 1: Initial Assessment
3. Prompt 2: Database Architecture
4. Prompt 5b: Audio Optimization
5. Prompt 3: Performance Optimization
6. Prompt 4: Production Readiness
```

### Crypto Risk Detection Extension
```
1. Import from Figma Make (UI components only)
2. Prompt 5c: Browser Extension Architecture - **FIRST**
3. Prompt 1: Initial Assessment (adapted for extensions)
4. Prompt 2: Database Architecture
5. Prompt 5a: AI Integration
6. Prompt 3: Performance Optimization
7. Prompt 4: Production Readiness
```

## Core Prompts

### Prompt 1: Initial Assessment & Foundation
**When to use**: Immediately after importing Figma Make code
**Purpose**: Analyze the exported code structure and establish a solid foundation
**Key outputs**:
- Project structure audit
- Dependency analysis
- Component hierarchy assessment
- Foundation files created
- Integration points identified

### Prompt 2: Database & State Architecture
**When to use**: After Phase 1 assessment
**Purpose**: Implement robust data architecture with Supabase
**Key outputs**:
- Supabase client configuration
- TypeScript types for database schema
- Custom hooks for data management
- Authentication flow
- Error boundaries and fallback strategies

### Prompt 3: Performance Optimization
**When to use**: After core architecture is in place
**Purpose**: Implement comprehensive performance optimizations
**Key outputs**:
- React.memo(), useMemo(), useCallback() optimizations
- Lazy loading and code splitting
- Image optimization with lazy loading
- Skeleton loading states
- Virtual scrolling for large lists
- Cache management system

### Prompt 4: Production Readiness
**When to use**: Before deployment
**Purpose**: Prepare application for production deployment
**Key outputs**:
- Comprehensive error handling and logging
- SEO optimization with meta tags
- Analytics integration
- Environment configuration
- Security measures
- Build optimization

## Add-On Prompts

### Prompt 5a: AI Integration
**When to use**: For projects requiring AI/LLM features
**Purpose**: Implement robust AI integration with cost management
**Key features**:
- OpenAI/Anthropic API integration
- Rate limiting and cost management
- Streaming responses
- Context management
- Error handling for AI failures

### Prompt 5b: Audio/Media Optimization
**When to use**: For projects with audio/video features
**Purpose**: Implement efficient audio streaming and processing
**Key features**:
- Audio streaming architecture
- Web Audio API integration
- Progressive loading
- CDN configuration
- Cost-optimized storage

### Prompt 5c: Browser Extension Architecture
**When to use**: For browser extensions - **MUST RUN FIRST**
**Purpose**: Set up extension-specific architecture
**Key features**:
- Manifest V3 configuration
- Content script architecture
- Background service workers
- Message passing patterns
- Chrome Storage API integration

### Prompt 5d: Real-time Features
**When to use**: For collaborative/real-time apps
**Purpose**: Implement real-time collaboration features
**Key features**:
- Supabase Realtime subscriptions
- Optimistic updates
- Conflict resolution
- Presence indicators
- Live data sync

## Decision Tree

### What type of project are you building?

**Browser Extension?**
→ Start with **Prompt 5c: Browser Extension Architecture**
→ Then follow standard sequence

**Web App with AI features?**
→ Follow standard sequence
→ Add **Prompt 5a: AI Integration** after Prompt 3

**Web App with audio/video?**
→ Follow standard sequence
→ Add **Prompt 5b: Audio Optimization** after Prompt 2

**Collaborative/Real-time app?**
→ Follow standard sequence
→ Add **Prompt 5d: Real-time Features** after Prompt 3

**Standard web app?**
→ Follow standard sequence (Prompts 1-4)

## Best Practices

### 1. Run Prompts in Order
Each prompt builds on the previous one. Don't skip steps.

### 2. Take Notes
Document any customizations or decisions made during each prompt.

### 3. Test After Each Prompt
Verify that the changes work correctly before moving to the next prompt.

### 4. Customize as Needed
These prompts are templates. Adapt them to your specific project requirements.

### 5. Reference Your Portfolio
All patterns are based on your working portfolio architecture. Use it as a reference.

## Troubleshooting

### Common Issues

**"Prompt doesn't apply to my project"**
- Check if you're using the right prompt sequence
- Browser extensions need Prompt 5c first
- Some prompts are optional based on project type

**"Code doesn't work after running prompt"**
- Check that you ran the prompts in the correct order
- Verify that all dependencies are installed
- Check the console for error messages

**"Performance is still slow"**
- Make sure you ran Prompt 3: Performance Optimization
- Check that lazy loading is implemented
- Verify that images are optimized

**"Database errors"**
- Ensure Prompt 2: Database Architecture was run
- Check that Supabase is properly configured
- Verify that RLS policies are set up

### Getting Help

1. Check the console for error messages
2. Verify that all dependencies are installed
3. Ensure prompts were run in the correct order
4. Reference your working portfolio for patterns
5. Check the specific prompt documentation for details

## File Structure

After running all prompts, your project should have:

```
src/
├── components/          # UI components (from Figma Make)
├── hooks/              # Custom hooks (useProjects, useAppSettings, etc.)
├── lib/                # External service integrations (Supabase, etc.)
├── utils/              # Utility functions (cache, validation, etc.)
├── types/              # TypeScript type definitions
├── pages/              # Page components
├── services/           # Service layer (AI, audio, etc.)
└── shared/             # Shared utilities (extensions only)
```

## Success Metrics

After completing all relevant prompts, you should have:

✅ **Performance**: Fast loading, smooth interactions, optimized bundle size
✅ **Scalability**: Architecture that grows with your project
✅ **Maintainability**: Clean code structure, proper TypeScript types
✅ **User Experience**: Skeleton loading, error handling, responsive design
✅ **Developer Experience**: Clear patterns, easy to extend, well-documented
✅ **Production Ready**: Error handling, SEO, analytics, security

## Next Steps

After completing the prompt sequence:

1. **Deploy**: Use your preferred platform (Vercel, Netlify, etc.)
2. **Monitor**: Set up error tracking and performance monitoring
3. **Iterate**: Use the established patterns to add new features
4. **Scale**: The architecture is designed to grow with your project

## Support

If you encounter issues:

1. Check the specific prompt documentation
2. Reference your working portfolio for patterns
3. Ensure all dependencies are properly installed
4. Verify that prompts were run in the correct order
5. Check the console for error messages

Remember: These prompts are designed to give you a production-ready application from the start. Take your time with each step, and don't hesitate to customize the patterns to fit your specific needs.

