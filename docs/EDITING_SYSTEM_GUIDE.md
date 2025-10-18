# Complete Editing System Guide

## ✅ What's Implemented

### Case Study Pages (ProjectDetail.tsx + CaseStudySections.tsx)

**All sections now have:**
1. ✅ **Title Editing** - Click Edit to modify both title AND content
2. ✅ **Up/Down Arrows** - Reorder sections (including "The solution")
3. ✅ **Individual Save/Cancel** - Each section edits independently
4. ✅ **Add/Remove Cards** - Below "The solution" section

**Editable Sections:**
- Overview
- The Challenge
- My role & impact cards (Leadership, Design, Research)
- Research insights
- Competitive analysis
- The solution
- All cards below the solution
- Project Images gallery (move up/down)
- Flow Diagrams gallery (move up/down)

### How Title Editing Works

**State Management:**
```typescript
const [editingSection, setEditingSection] = useState<string | null>(null);
const [editedSectionTitle, setEditedSectionTitle] = useState<string>("");
const [editedSectionContent, setEditedSectionContent] = useState<string>("");
const [originalSectionTitle, setOriginalSectionTitle] = useState<string>("");
const [originalSectionContent, setOriginalSectionContent] = useState<string>("");
```

**Start Editing:**
```typescript
const startEditingSection = (sectionTitle: string, sectionContent: string) => {
  setEditingSection(sectionTitle);
  setEditedSectionTitle(sectionTitle);
  setEditedSectionContent(sectionContent);
  setOriginalSectionTitle(sectionTitle);
  setOriginalSectionContent(sectionContent);
};
```

**Save Changes:**
```typescript
const saveSectionEdit = (sectionTitle: string) => {
  // Find and replace section in markdown
  // Updates both: `# ${editedSectionTitle}` AND content
  onContentUpdate(newContent);
  // Clear editing state
};
```

**UI Pattern:**
```tsx
{isEditMode && editingSection === section.title ? (
  <div className="space-y-4">
    {/* Title Input */}
    <div>
      <label className="block text-sm font-medium mb-2">Section Title</label>
      <Input
        value={editedSectionTitle}
        onChange={(e) => setEditedSectionTitle(e.target.value)}
        className="text-2xl font-bold"
      />
    </div>
    
    {/* Content Textarea */}
    <div>
      <label className="block text-sm font-medium mb-2">Section Content (Markdown)</label>
      <Textarea
        value={editedSectionContent}
        onChange={(e) => setEditedSectionContent(e.target.value)}
        className="min-h-[300px] font-mono text-sm"
      />
    </div>
    
    {/* Save/Cancel Buttons */}
    <div className="flex gap-2 justify-end">
      <Button onClick={cancelSectionEdit}>Cancel</Button>
      <Button onClick={() => saveSectionEdit(section.title)}>Save</Button>
    </div>
  </div>
) : (
  <MarkdownRenderer content={section.content.trim()} />
)}
```

---

## 🔲 To Extend to Other Pages

### Pattern for About, Contact, Music, Visuals Pages

**1. Add State Management**

```typescript
// In each page component (About.tsx, Contact.tsx, etc.)
const [isEditing, setIsEditing] = useState(false);
const [editedTitle, setEditedTitle] = useState<string>("");
const [editedContent, setEditedContent] = useState<string>("");
const [originalTitle, setOriginalTitle] = useState<string>("");
const [originalContent, setOriginalContent] = useState<string>("");
```

**2. Add localStorage Persistence**

```typescript
// Load on mount
useEffect(() => {
  const savedContent = localStorage.getItem('aboutPageContent'); // or musicPageContent, etc.
  if (savedContent) {
    try {
      const parsed = JSON.parse(savedContent);
      setEditedTitle(parsed.title || "Default Title");
      setEditedContent(parsed.content || "Default content...");
    } catch (e) {
      console.error('Error loading page content:', e);
    }
  }
}, []);

// Save function
const handleSave = () => {
  const data = {
    title: editedTitle,
    content: editedContent,
    lastModified: new Date().toISOString()
  };
  localStorage.setItem('aboutPageContent', JSON.stringify(data));
  setIsEditing(false);
  // Show success notification
};
```

**3. Add Edit UI**

```tsx
{isEditMode && (
  <div className="flex justify-end gap-2 mb-6">
    {isEditing ? (
      <>
        <Button onClick={() => setIsEditing(false)} variant="outline">
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </>
    ) : (
      <Button onClick={() => setIsEditing(true)} variant="outline">
        <Edit2 className="w-4 h-4 mr-2" />
        Edit Page
      </Button>
    )}
  </div>
)}

{isEditing ? (
  <div className="space-y-6">
    {/* Title Input */}
    <div>
      <label className="block text-sm font-medium mb-2">Page Title</label>
      <Input
        value={editedTitle}
        onChange={(e) => setEditedTitle(e.target.value)}
        className="text-3xl font-bold"
      />
    </div>
    
    {/* Content Textarea */}
    <div>
      <label className="block text-sm font-medium mb-2">Page Content (Markdown)</label>
      <Textarea
        value={editedContent}
        onChange={(e) => setEditedContent(e.target.value)}
        className="min-h-[500px] font-mono text-sm"
      />
    </div>
  </div>
) : (
  <>
    <h1>{editedTitle}</h1>
    <MarkdownRenderer content={editedContent} />
  </>
)}
```

**4. Add Props from App.tsx**

Make sure `isEditMode` is passed to each page:

```tsx
// In App.tsx - already done for case studies
{currentPage === "about" && (
  <About onBack={navigateHome} isEditMode={isEditMode} />
)}
```

---

## 📋 Implementation Checklist

### About Page
- [ ] Add state management for title and content
- [ ] Add localStorage persistence
- [ ] Add Edit/Save/Cancel buttons (visible only in edit mode)
- [ ] Add title input field (when editing)
- [ ] Add content textarea (when editing)
- [ ] Add MarkdownRenderer for display (when not editing)
- [ ] Test save/load functionality
- [ ] Test export/import with new fields

### Contact Page
- [ ] Same steps as About page
- [ ] Ensure form functionality still works
- [ ] Add editable sections for:
  - Page intro text
  - Contact methods
  - Form labels/placeholders

### Music Page
- [ ] Same steps as About page
- [ ] Add editable sections for:
  - Page intro
  - Each music project title and description
  - Music embed URLs

### Visuals Page
- [ ] Same steps as About page
- [ ] Add editable sections for:
  - Page intro
  - Each visual project title and description
  - Visual embed URLs

---

## 🎯 Sidebar Sections (At a Glance, Impact)

**Current State:** Sidebars are parsed from case study content but NOT directly editable.

**To Make Editable:**

1. Add dedicated edit buttons to AtAGlanceSidebar.tsx and ImpactSidebar.tsx:

```tsx
// In AtAGlanceSidebar.tsx
interface AtAGlanceSidebarProps {
  content: string;
  isEditMode?: boolean;
  onUpdate?: (newContent: string) => void;
}

export function AtAGlanceSidebar({ content, isEditMode, onUpdate }: AtAGlanceSidebarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("At a glance");
  const [editedContent, setEditedContent] = useState(content);
  
  const handleSave = () => {
    // Update the parent case study content
    if (onUpdate) {
      onUpdate(editedContent);
    }
    setIsEditing(false);
  };
  
  return (
    <div className="...">
      {isEditMode && (
        <div className="flex justify-end mb-2">
          {isEditing ? (
            <Button onClick={handleSave}>Save</Button>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit</Button>
          )}
        </div>
      )}
      
      {isEditing ? (
        <>
          <Input value={editedTitle} onChange={e => setEditedTitle(e.target.value)} />
          <Textarea value={editedContent} onChange={e => setEditedContent(e.target.value)} />
        </>
      ) : (
        <MarkdownRenderer content={content} />
      )}
    </div>
  );
}
```

2. Update ProjectDetail.tsx to pass the props:

```tsx
<AtAGlanceSidebar 
  content={atGlanceContent.content}
  isEditMode={isEditMode}
  onUpdate={(newContent) => {
    // Update the case study content with new sidebar content
    // This requires parsing and replacing the "# At a glance" section
  }}
/>
```

---

## 💾 Export/Import Compatibility

All editable content is stored in localStorage and will be included in exports:

**Case Studies:**
- Already includes: `caseStudyContent` (markdown with titles and content)
- Positions: `projectImagesPosition`, `flowDiagramsPosition`

**New Fields to Add for Other Pages:**
```javascript
const exportData = {
  // ... existing fields
  aboutPage: localStorage.getItem('aboutPageContent'),
  contactPage: localStorage.getItem('contactPageContent'),
  musicPage: localStorage.getItem('musicPageContent'),
  visualsPage: localStorage.getItem('visualsPageContent'),
};
```

Add to `handleExportData` and `handleImportData` in App.tsx.

---

## 🚀 Benefits of This System

1. ✅ **Consistent UX** - Same editing experience across all pages
2. ✅ **Granular Control** - Edit titles and content separately
3. ✅ **Native Undo/Redo** - Works in all textareas (Ctrl+Z, Ctrl+Y)
4. ✅ **Auto-Save to localStorage** - Changes persist across sessions
5. ✅ **Export/Import Ready** - All content included in backups
6. ✅ **Markdown Support** - Rich formatting for all content
7. ✅ **Reorderable Sections** - Up/down arrows for flexible layouts
8. ✅ **Add/Remove Capability** - Dynamic content management

---

## 📝 Testing Checklist

After implementing on each page:

- [ ] Edit mode toggle shows edit UI
- [ ] Title field updates correctly
- [ ] Content field updates correctly
- [ ] Save button persists changes to localStorage
- [ ] Cancel button restores original values
- [ ] Changes survive page refresh
- [ ] Export includes the new data
- [ ] Import restores the data correctly
- [ ] Markdown renders properly in preview mode
- [ ] Native undo/redo works in text fields

---

## 🎨 Current Status

✅ **COMPLETE:**
- Case study sections (all types)
- Project Images & Flow Diagrams galleries
- Up/down arrows on all sections
- Add/remove cards below "The solution"
- Title + content editing for all case study sections

🔲 **TODO:**
- About page editing
- Contact page editing
- Music page editing
- Visuals page editing
- Sidebar title editing (At a glance, Impact)

---

## 📞 Need Help?

Reference files:
- `/components/CaseStudySections.tsx` - Complete example of section editing
- `/pages/ProjectDetail.tsx` - Shows how to pass callbacks and handle updates
- `/App.tsx` - Shows export/import implementation
- `/components/MarkdownRenderer.tsx` - For rendering markdown content

Pattern to follow:
1. Add state (title + content)
2. Add localStorage save/load
3. Add edit UI (Input + Textarea)
4. Add Save/Cancel buttons
5. Test thoroughly!
