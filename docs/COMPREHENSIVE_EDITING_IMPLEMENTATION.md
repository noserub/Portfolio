# Comprehensive Site-Wide Editing Implementation - COMPLETE GUIDE

## ✅ What's Implemented

### **Case Study Pages (100% Complete)**
- ✅ All section titles editable
- ✅ All section content editable (markdown)
- ✅ Individual Save/Cancel buttons
- ✅ Up/Down arrows on all sections (including "The solution")
- ✅ Add/Remove cards below "The solution"
- ✅ Project Images & Flow Diagrams movable (entire sections with up/down arrows)

### **About Page (Partially Complete - 30%)**
- ✅ Bio paragraph 1 editable
- ✅ Bio paragraph 2 editable
- ✅ localStorage persistence
- ❌ Super Powers section (needs implementation)
- ❌ Highlights section (needs implementation)  
- ❌ Leadership & Impact section (needs implementation)

### **Contact Page (Partially Complete - 20%)**
- ✅ Page subtitle editable
- ✅ localStorage persistence
- ❌ Email contact info (needs implementation)
- ❌ Location info (needs implementation)
- ❌ Availability status (needs implementation)

### **Music Page (Not Started - 0%)**
- ❌ Needs full implementation

### **Visuals Page (Not Started - 0%)**
- ❌ Needs full implementation

---

## 🚀 Quick Implementation Pattern

### Pattern 1: Simple Text Field (like Contact subtitle)

```tsx
// 1. Add state
const [text, setText] = useState("Default text");
const [editingSection, setEditingSection] = useState<string | null>(null);
const [editedText, setEditedText] = useState("");

// 2. Load from localStorage
useEffect(() => {
  const saved = localStorage.getItem('myPageContent');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.text) setText(parsed.text);
  }
}, []);

// 3. Save to localStorage
const saveToLocalStorage = () => {
  localStorage.setItem('myPageContent', JSON.stringify({ text }));
};

// 4. Edit/Save/Cancel handlers
const handleEdit = () => {
  setEditingSection('text');
  setEditedText(text);
};

const handleSave = () => {
  setText(editedText);
  setEditingSection(null);
  setTimeout(saveToLocalStorage, 100);
};

const handleCancel = () => {
  setEditingSection(null);
  setEditedText("");
};

// 5. Render with edit UI
{isEditMode && editingSection !== 'text' && (
  <Button onClick={handleEdit}>
    <Edit2 className="w-3 h-3 mr-2" />
    Edit Text
  </Button>
)}

{editingSection === 'text' ? (
  <div className="space-y-4">
    <Textarea
      value={editedText}
      onChange={(e) => setEditedText(e.target.value)}
    />
    <div className="flex gap-2">
      <Button onClick={handleCancel}>Cancel</Button>
      <Button onClick={handleSave}>Save</Button>
    </div>
  </div>
) : (
  <p>{text}</p>
)}
```

---

## 📋 Step-by-Step: Complete Contact Page

### Add Contact Info Editing

Update `/pages/Contact.tsx`:

```tsx
// Already have: pageSubtitle ✅
// Need to add editing UI for email, location, availability

// The email section is around line 401:
<a href={`mailto:${contactInfo.email}`}>
  {contactInfo.email}
</a>

// Change to:
{isEditMode && editingSection !== 'email' && (
  <Button size="sm" variant="ghost" onClick={() => handleEdit('email', contactInfo.email)}>
    <Edit2 className="w-3 h-3 mr-1" />
  </Button>
)}

{editingSection === 'email' ? (
  <div className="space-y-2">
    <Input
      value={editedText}
      onChange={(e) => setEditedText(e.target.value)}
      placeholder="email@example.com"
    />
    <div className="flex gap-2">
      <Button size="sm" onClick={handleCancel}>Cancel</Button>
      <Button size="sm" onClick={() => handleSave('email')}>Save</Button>
    </div>
  </div>
) : (
  <a href={`mailto:${contactInfo.email}`}>
    {contactInfo.email}
  </a>
)}
```

Repeat for location and availability.

---

## 📋 Step-by-Step: Music Page

The Music page needs to become fully editable. Here's the structure:

### Music Page Content Structure

```tsx
interface MusicProject {
  id: string;
  title: string;
  description: string;
  embedUrl: string;
  published: boolean;
}

const [pageTitle, setPageTitle] = useState("Music");
const [pageIntro, setPageIntro] = useState("My music projects...");
const [projects, setProjects] = useState<MusicProject[]>([]);
```

### Load/Save Pattern

```tsx
useEffect(() => {
  const saved = localStorage.getItem('musicPageContent');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.pageTitle) setPageTitle(parsed.pageTitle);
    if (parsed.pageIntro) setPageIntro(parsed.pageIntro);
    if (parsed.projects) setProjects(parsed.projects);
  }
}, []);

const saveToLocalStorage = () => {
  const data = { pageTitle, pageIntro, projects };
  localStorage.setItem('musicPageContent', JSON.stringify(data));
};
```

### Add/Edit/Delete Projects

```tsx
const addProject = () => {
  const newProject: MusicProject = {
    id: Date.now().toString(),
    title: "New Music Project",
    description: "Description here...",
    embedUrl: "",
    published: true
  };
  setProjects([...projects, newProject]);
  setTimeout(saveToLocalStorage, 100);
};

const updateProject = (id: string, updates: Partial<MusicProject>) => {
  setProjects(projects.map(p => 
    p.id === id ? { ...p, ...updates } : p
  ));
  setTimeout(saveToLocalStorage, 100);
};

const deleteProject = (id: string) => {
  if (confirm('Delete this project?')) {
    setProjects(projects.filter(p => p.id !== id));
    setTimeout(saveToLocalStorage, 100);
  }
};
```

### Render with Edit UI

```tsx
{isEditMode && (
  <Button onClick={addProject}>
    <Plus className="w-4 h-4 mr-2" />
    Add Music Project
  </Button>
)}

{projects.map(project => (
  <div key={project.id}>
    {isEditMode && editingProjectId === project.id ? (
      <div className="space-y-4">
        <Input
          value={project.title}
          onChange={(e) => updateProject(project.id, { title: e.target.value })}
          placeholder="Project title"
        />
        <Textarea
          value={project.description}
          onChange={(e) => updateProject(project.id, { description: e.target.value })}
          placeholder="Project description"
        />
        <Input
          value={project.embedUrl}
          onChange={(e) => updateProject(project.id, { embedUrl: e.target.value })}
          placeholder="Embed URL (YouTube, SoundCloud, etc.)"
        />
        <div className="flex gap-2">
          <Button onClick={() => setEditingProjectId(null)}>Done</Button>
          <Button variant="destructive" onClick={() => deleteProject(project.id)}>Delete</Button>
        </div>
      </div>
    ) : (
      <>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        {project.embedUrl && (
          <iframe src={project.embedUrl} />
        )}
        {isEditMode && (
          <Button onClick={() => setEditingProjectId(project.id)}>
            <Edit2 className="w-3 h-3 mr-2" />
            Edit
          </Button>
        )}
      </>
    )}
  </div>
))}
```

---

## 📋 Step-by-Step: Visuals Page

Same pattern as Music page, but for visual projects (videos, images, artwork).

### Visuals Page Content Structure

```tsx
interface VisualProject {
  id: string;
  title: string;
  description: string;
  mediaType: 'image' | 'video' | 'embed';
  mediaUrl: string;
  embedUrl?: string;
  published: boolean;
}
```

Follow same add/edit/delete pattern as Music page.

---

## 📋 Step-by-Step: Complete About Page

The About page has many sections. The practical approach:

### Editable Sections

1. **Bio (✅ Already done)**
2. **Super Powers (5 items)**
3. **Highlights (2 items)**
4. **Leadership & Impact (3 items)**

### Super Powers Implementation

```tsx
const [superPowers, setSuperPowers] = useState([
  "Interaction and UI design, user research",
  "Translating business strategy into intuitive digital products",
  "Bridging the gap between development, product, and stakeholders",
  "Driving product-market fit through iterative discovery and design",
  "Scaling and mentoring UX teams"
]);

// Load from localStorage
useEffect(() => {
  const saved = localStorage.getItem('aboutPageContent');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.superPowers) setSuperPowers(parsed.superPowers);
  }
}, []);

// Save
const saveToLocalStorage = () => {
  const data = { ...otherFields, superPowers };
  localStorage.setItem('aboutPageContent', JSON.stringify(data));
};

// Update super power
const updateSuperPower = (index: number, newText: string) => {
  const updated = [...superPowers];
  updated[index] = newText;
  setSuperPowers(updated);
  setTimeout(saveToLocalStorage, 100);
};

// Render
{superPowers.map((power, index) => (
  <div key={index}>
    {isEditMode && editingSection === `power-${index}` ? (
      <div className="space-y-2">
        <Textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
        />
        <div className="flex gap-2">
          <Button onClick={() => {
            updateSuperPower(index, editedText);
            setEditingSection(null);
          }}>Save</Button>
          <Button onClick={() => setEditingSection(null)}>Cancel</Button>
        </div>
      </div>
    ) : (
      <>
        <p>{power}</p>
        {isEditMode && (
          <Button onClick={() => {
            setEditingSection(`power-${index}`);
            setEditedText(power);
          }}>
            <Edit2 />
          </Button>
        )}
      </>
    )}
  </div>
))}
```

---

## 🎯 Export/Import Integration

All new localStorage keys need to be added to export/import in App.tsx:

```tsx
// In handleExportData:
const exportData = {
  // ... existing fields
  aboutPageContent: localStorage.getItem('aboutPageContent'),
  contactPageContent: localStorage.getItem('contactPageContent'),
  musicPageContent: localStorage.getItem('musicPageContent'),
  visualsPageContent: localStorage.getItem('visualsPageContent'),
};

// In handleImportData:
if (data.aboutPageContent) localStorage.setItem('aboutPageContent', data.aboutPageContent);
if (data.contactPageContent) localStorage.setItem('contactPageContent', data.contactPageContent);
if (data.musicPageContent) localStorage.setItem('musicPageContent', data.musicPageContent);
if (data.visualsPageContent) localStorage.setItem('visualsPageContent', data.visualsPageContent);
```

---

## ✅ Testing Checklist

For each page:

- [ ] Edit mode shows edit buttons
- [ ] Click edit opens textarea/input
- [ ] Text changes appear in field
- [ ] Cancel restores original
- [ ] Save persists to localStorage
- [ ] Refresh keeps changes
- [ ] Export includes data
- [ ] Import restores data
- [ ] Preview mode hides edit buttons
- [ ] Native undo/redo works (Ctrl+Z, Ctrl+Y)

---

## 🎨 UI Consistency Guidelines

All edit UIs should follow this pattern:

1. **Edit Button:** `<Edit2 className="w-3 h-3 mr-2" />` + Text
2. **Save Button:** `<Save className="w-3 h-3 mr-1" />` + "Save"
3. **Cancel Button:** `<X className="w-3 h-3 mr-1" />` + "Cancel"
4. **Input/Textarea:** Use existing shadcn components
5. **Labels:** `<label className="block text-sm font-medium">`
6. **Button Sizes:** `size="sm"` for inline edits
7. **Spacing:** `space-y-4` for form fields

---

## 📝 Current Status Summary

| Page | Bio/Intro | Sections | Media | Export | Status |
|------|-----------|----------|-------|--------|--------|
| Case Studies | ✅ | ✅ | ✅ | ✅ | 100% Complete |
| About | ✅ | ❌ | N/A | ❌ | 30% Complete |
| Contact | ✅ | ❌ | N/A | ❌ | 20% Complete |
| Music | ❌ | ❌ | ❌ | ❌ | 0% Complete |
| Visuals | ❌ | ❌ | ❌ | ❌ | 0% Complete |

---

## 🚀 Priority Order to Complete

1. **Contact Page** (easiest - just 3 more fields)
   - Add email editing ✅ State exists
   - Add location editing ✅ State exists
   - Add availability editing ✅ State exists
   - Update export/import

2. **Music Page** (medium - new structure)
   - Create project data structure
   - Add localStorage persistence
   - Add project CRUD operations
   - Update export/import

3. **Visuals Page** (medium - similar to Music)
   - Same pattern as Music page
   - Support image/video types

4. **About Page** (complex - many sections)
   - Super Powers (5 items)
   - Highlights (2 items)
   - Leadership & Impact (3 items)
   - Update export/import

---

## 💡 Tips

- **Start simple:** Get one field working end-to-end before adding more
- **Test often:** After each change, test edit/save/cancel/refresh cycle
- **Use console.log:** Debug localStorage saves: `console.log('Saved:', data)`
- **Export early:** Test export/import after adding each new page
- **Copy patterns:** The Contact subtitle is a perfect template to copy

---

## 🎯 Next Steps

You now have everything you need to complete the implementation:

1. **Follow the patterns** above for each page
2. **Test as you go** - one section at a time
3. **Update export/import** after each page
4. **Refer to existing code** in CaseStudySections.tsx and Contact.tsx for examples

The framework is in place - it's just a matter of applying the same pattern to each remaining section!
