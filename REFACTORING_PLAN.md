# Case Study Section Refactoring Plan

## Overview
Move from title-based markdown parsing to a flexible JSON-based section system with editable titles and unified component types.

## Proposed Structure

### New JSON Schema
```typescript
interface CaseStudySection {
  id: string;
  type: 'body' | 'card-1' | 'card-2' | 'card-3' | 'card-4' | 'image-gallery' | 'video-gallery';
  title: string;
  content: string; // Markdown for body/cards, JSON array for galleries
  position: number;
  visible: boolean;
  // Type-specific config
  layout?: '2x2' | '3x3'; // For card-2, card-4
  aspectRatio?: string; // For galleries
  columns?: number; // For galleries
}
```

### Section Type Mapping
- **body**: Overview, The challenge, The solution (all the same component)
- **card-1**: Competitive analysis
- **card-2**: Research insights (with layout option)
- **card-3**: Solution cards
- **card-4**: Key features (with layout option)
- **image-gallery**: Project images, Flow diagrams (unified)
- **video-gallery**: Videos (unique functionality)

## Migration Strategy

### Phase 1: Database Migration
1. Add `case_study_sections` JSONB column to `projects` table
2. Create migration script to convert existing markdown sections to JSON

### Phase 2: Component Updates
1. Create unified `BodySection` component
2. Create unified `CardSection` component with layout options
3. Create unified `ImageGallery` component
4. Update `CaseStudySections` to render from JSON instead of parsing markdown

### Phase 3: Editor Updates
1. Update menu system:
   - Content > Body section
   - Content > Card style 1 (Competitive analysis)
   - Content > Card style 2 (Research insights)
   - Content > Card style 3 (Solution cards)
   - Content > Card style 4 (Key features)
   - Galleries > Image gallery
   - Galleries > Video gallery
2. Add drag-and-drop reordering
3. Add inline title editing

### Phase 4: Backward Compatibility
1. Auto-migrate existing projects on first load
2. Keep markdown parsing as fallback
3. Support both old and new formats during transition

## Risk Mitigation
1. Test with new projects first
2. Keep markdown fallback for 6+ months
3. Add data validation and error handling
4. Create rollback migration
5. Extensive testing before merge

## Estimated Timeline
- Database migration: 1 day
- Component updates: 3-4 days
- Editor updates: 2-3 days
- Testing & migration: 2 days
- Total: ~8-10 days

