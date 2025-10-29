# Post-Figma Make Architecture Prompts

A comprehensive system of prompts to transform Figma Make exports into production-ready applications with enterprise-grade architecture.

## 🚀 Quick Start

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

## 📁 Repository Structure

```
prompts/
├── 01_INITIAL_ASSESSMENT.md          # Foundation & analysis
├── 02_DATABASE_ARCHITECTURE.md       # Supabase & data layer
├── 03_PERFORMANCE_OPTIMIZATION.md    # React optimizations
├── 04_PRODUCTION_READINESS.md        # Deployment preparation
├── 05a_AI_INTEGRATION.md             # AI/LLM features
├── 05b_AUDIO_OPTIMIZATION.md         # Audio/video features
├── 05c_BROWSER_EXTENSION.md          # Extension architecture
├── 05d_REALTIME_FEATURES.md          # Real-time collaboration
└── README_PROMPT_GUIDE.md            # Complete usage guide
```

## 🎯 Project-Specific Sequences

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
1. Import from Figma Make (UI only)
2. Prompt 5c: Browser Extension Architecture - FIRST
3. Prompt 1: Initial Assessment (adapted)
4. Prompt 2: Database Architecture
5. Prompt 5a: AI Integration
6. Prompt 3: Performance Optimization
7. Prompt 4: Production Readiness
```

## 🛠️ How to Use

### Option 1: Clone and Copy
```bash
# Clone the prompts repository
git clone https://github.com/yourusername/post-figma-architecture-prompts.git temp-prompts

# Copy prompts to your new project
cp -r temp-prompts/prompts ./docs/

# Clean up
rm -rf temp-prompts
```

### Option 2: Reference from GitHub
- Bookmark the repository
- Reference prompts directly from GitHub
- Copy individual prompts as needed

### Option 3: Download ZIP
- Download the repository as ZIP
- Extract the `prompts/` folder
- Copy to your project's `docs/` directory

## 📋 What You Get

After running the appropriate prompt sequence:

✅ **Production-ready architecture** from day one  
✅ **Performance optimizations** (React.memo, lazy loading, caching)  
✅ **Robust data layer** (Supabase, custom hooks, error handling)  
✅ **Type-safe codebase** (comprehensive TypeScript types)  
✅ **Scalable patterns** (based on proven portfolio architecture)  
✅ **Cost optimization** (intelligent caching, rate limiting)  
✅ **Developer experience** (clear patterns, easy to extend)  

## 🎨 Key Features

- **Directive prompts** - minimize back-and-forth
- **Type-safe** - enforces TypeScript best practices
- **Performance-first** - optimizes from the start
- **Cost-conscious** - minimizes API calls and storage costs
- **Scalable** - architecture that grows with your project
- **Developer-friendly** - clear patterns for non-experts

## 🔧 Core Prompts

### Prompt 1: Initial Assessment & Foundation
**When to use**: Immediately after importing Figma Make code
- Project structure audit
- Dependency analysis
- Component hierarchy assessment
- Foundation files creation

### Prompt 2: Database & State Architecture
**When to use**: After Phase 1 assessment
- Supabase integration with TypeScript types
- Custom hooks architecture
- Database schema design
- Authentication flow
- Error boundaries

### Prompt 3: Performance Optimization
**When to use**: After core architecture is in place
- React.memo(), useMemo(), useCallback()
- Lazy loading and code splitting
- Image optimization
- Skeleton loading states
- Virtual scrolling
- Cache management

### Prompt 4: Production Readiness
**When to use**: Before deployment
- Error handling and logging
- SEO optimization
- Analytics integration
- Environment management
- Security best practices

## 🎯 Add-On Prompts

### Prompt 5a: AI Integration
For projects requiring AI/LLM features:
- OpenAI/Anthropic API integration
- Rate limiting and cost management
- Streaming responses
- Context management

### Prompt 5b: Audio/Media Optimization
For projects with audio/video:
- Audio streaming architecture
- Web Audio API integration
- Progressive loading
- CDN configuration

### Prompt 5c: Browser Extension Architecture
For browser extensions (run FIRST):
- Manifest V3 setup
- Content script architecture
- Background service workers
- Message passing patterns

### Prompt 5d: Real-time Features
For collaborative/real-time apps:
- Supabase Realtime subscriptions
- Optimistic updates
- Conflict resolution
- Presence indicators

## 📖 Documentation

- **`README_PROMPT_GUIDE.md`** - Complete usage instructions and decision tree
- Each prompt is self-contained with detailed instructions
- All patterns are based on proven portfolio architecture
- Examples and code snippets included

## 🤝 Contributing

This repository contains battle-tested prompts based on real production applications. Contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your improvements
4. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter issues:

1. Check the specific prompt documentation
2. Ensure prompts are run in the correct order
3. Verify all dependencies are installed
4. Check the console for error messages
5. Reference the working portfolio patterns

## 🎉 Success Stories

These prompts have been used to build:
- Production portfolio websites
- AI-powered applications
- Real-time collaborative tools
- Browser extensions
- Music streaming platforms

---

**Ready to build production-ready applications from Figma Make exports?** Start with the [Complete Usage Guide](prompts/README_PROMPT_GUIDE.md) and follow the appropriate sequence for your project type.


