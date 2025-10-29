# Prompt 1: Initial Assessment & Foundation

## When to Use
**Immediately after importing Figma Make code** - This is your first step to transform the exported UI into a production-ready application.

## Objective
Analyze the Figma Make export and establish a solid foundation for scalable architecture, identifying potential issues before they become problems.

## Instructions

### Step 1: Project Structure Audit
Examine the current project structure and identify:

1. **Component Organization**
   - Are components properly organized in `/src/components/`?
   - Are there any components that should be split into smaller pieces?
   - Are there any components that are too large (>200 lines)?

2. **File Structure Analysis**
   - Check if there's a clear separation between:
     - UI components (`/components/`)
     - Business logic (`/hooks/`, `/utils/`)
     - Data layer (`/lib/`, `/types/`)
     - Pages (`/pages/`)

3. **Import/Export Patterns**
   - Are there circular dependencies?
   - Are components properly exported from index files?
   - Are there any unused imports?

### Step 2: Dependency Analysis
Review `package.json` and identify:

1. **Essential Dependencies** (should be present):
   ```json
   {
     "react": "^18.3.1",
     "react-dom": "^18.3.1",
     "@supabase/supabase-js": "^2.75.1",
     "typescript": "^5.0.0",
     "vite": "^6.4.0"
   }
   ```

2. **Performance Dependencies** (add if missing):
   ```json
   {
     "motion": "*",
     "react-dnd": "*",
     "react-dnd-html5-backend": "*"
   }
   ```

3. **UI Library Dependencies** (verify these are present):
   ```json
   {
     "@radix-ui/react-*": "latest",
     "class-variance-authority": "^0.7.1",
     "clsx": "*",
     "tailwind-merge": "*"
   }
   ```

### Step 3: Routing Architecture Assessment
Check the current routing setup:

1. **Route Structure**
   - Are routes properly defined?
   - Is there a clear page hierarchy?
   - Are there any nested routes that need attention?

2. **Navigation Patterns**
   - How is navigation handled between pages?
   - Are there any hardcoded routes that should be dynamic?
   - Is browser history properly managed?

### Step 4: Component Hierarchy Assessment
Analyze the component tree:

1. **Data-Heavy Components**
   - Identify components that will need:
     - State management
     - API calls
     - Real-time updates
     - Complex user interactions

2. **Reusable Components**
   - Which components can be made reusable?
   - Are there any components that should be extracted into a design system?
   - Are there any components that are too specific to one use case?

3. **Performance-Critical Components**
   - Identify components that will:
     - Render large lists
     - Handle complex animations
     - Process large amounts of data
     - Make frequent API calls

### Step 5: TypeScript Analysis
Check TypeScript implementation:

1. **Type Safety**
   - Are all props properly typed?
   - Are there any `any` types that should be more specific?
   - Are component interfaces properly defined?

2. **Missing Types**
   - Identify data structures that need TypeScript interfaces
   - Check if API responses are properly typed
   - Verify that component props have proper types

### Step 6: Performance Baseline
Establish current performance metrics:

1. **Bundle Analysis**
   - Run `npm run analyze` (if available) to check bundle size
   - Identify large dependencies
   - Check for duplicate dependencies

2. **Component Complexity**
   - Count the number of components
   - Identify the most complex components
   - Check for any components with too many props

### Step 7: Create Foundation Files
Based on the assessment, create these essential files:

1. **Type Definitions** (`/src/types/index.ts`)
   ```typescript
   // Add all necessary type definitions based on your analysis
   export interface User {
     id: string;
     email: string;
     // Add other user properties
   }
   
   // Add other interfaces as needed
   ```

2. **Constants** (`/src/constants/index.ts`)
   ```typescript
   export const API_ENDPOINTS = {
     // Define your API endpoints
   };
   
   export const APP_CONFIG = {
     // Define app configuration
   };
   ```

3. **Utility Functions** (`/src/utils/index.ts`)
   ```typescript
   // Add utility functions that will be needed
   export const formatDate = (date: Date) => {
     // Implementation
   };
   ```

### Step 8: Identify Integration Points
Based on your project type, identify where you'll need:

1. **Database Integration**
   - Which components will need data persistence?
   - What data structures will be stored?
   - How will real-time updates be handled?

2. **External API Integration**
   - What external services will be integrated?
   - How will authentication be handled?
   - What rate limiting will be needed?

3. **Performance Optimizations**
   - Which components need lazy loading?
   - Where will caching be implemented?
   - What components need memoization?

## Expected Output
After running this prompt, you should have:

1. ✅ A clear understanding of the current codebase structure
2. ✅ Identified components that need optimization
3. ✅ A list of missing dependencies
4. ✅ Foundation files created
5. ✅ A roadmap for the next steps

## Next Steps
After completing this assessment:
- Run **Prompt 2: Database & State Architecture** to set up the data layer
- Or run **Prompt 5c: Browser Extension Architecture** if this is a browser extension project

## Notes
- This prompt is designed to be run once per project
- Take detailed notes during the assessment - they'll be valuable for the next prompts
- Don't make major changes yet - just analyze and prepare the foundation


