# About Page - Complete Editing Implementation Plan

## Overview
The About page needs comprehensive editing capability for all sections. Due to the file size and complexity, this document provides the complete implementation strategy.

## Sections to Make Editable

### 1. ✅ DONE - Bio Sections
- Bio paragraph 1
- Bio paragraph 2

### 2. ✅ DONE - Super Powers
- Section title
- 5 super power items

### 3. 🔲 TODO - Highlights Section
**Structure:**
- Section title: "Highlights"
- Cards (2 items):
  - Card 1: {icon: Award, title: "Awards & Patents", text: "..."}
  - Card 2: {icon: Rocket, title: "Product Launches", text: "..."}

**State needed:**
```typescript
const [highlightsTitle, setHighlightsTitle] = useState("Highlights");
const [highlights, setHighlights] = useState([
  {
    title: "Awards & Patents",
    text: "6 U.S. patents and 2 medical device excellence awards for the t:slim insulin pump"
  },
  {
    title: "Product Launches",
    text: "Launched 0–1 products: Skype for Android Tablet, Skype Qik, t:slim insulin pump"
  }
]);
```

### 4. 🔲 TODO - Leadership & Impact Section
**Structure:**
- Section title: "Leadership & Impact"
- Cards (3 items):
  - Card 1: {icon: TrendingUp, title: "Executive Leadership", text: "..."}
  - Card 2: {icon: Lightbulb, title: "Strategic Partner", text: "..."}
  - Card 3: {icon: Boxes, title: "Versatile Skillset", text: "..."}

**State needed:**
```typescript
const [leadershipTitle, setLeadershipTitle] = useState("Leadership & Impact");
const [leadershipItems, setLeadershipItems] = useState([
  {
    title: "Executive Leadership",
    text: "Trusted to lead cross-functional teams, influence at the exec level, and deliver results that increase user happiness and business value"
  },
  {
    title: "Strategic Partner",
    text: "Deep contributor and mentor in product strategy, product design, research, and design systems"
  },
  {
    title: "Versatile Skillset",
    text: "Skilled across multiple design disciplines: UX, UI, research, prototyping, systems thinking"
  }
]);
```

### 5. 🔲 TODO - Expertise Section
**Note:** This might be in an accordion or separate section. Need to find it in the file.

### 6. 🔲 TODO - How I Use AI Section
**Note:** Need to locate this section in the file.

### 7. 🔲 TODO - Process Section
**Structure:**
- Section title
- Subtext/description
- Cards with title and body

### 8. 🔲 TODO - Certifications Section
**Structure:**
- Section title
- Cards with: acronym, title, subtext

### 9. 🔲 TODO - Tools Section
**Structure:**
- Section title  
- Pills/badges (array of strings)

## Implementation Strategy

### Phase 1: Extend State Management
Add all new state variables to the component and localStorage integration.

### Phase 2: Update localStorage Functions
Extend `saveToLocalStorage()` and `useEffect` load to include all new fields.

### Phase 3: Update handleSave Function
Add cases for all new section types.

### Phase 4: Create Edit UI
For each section, add:
- Title editing (Input field)
- Card/item editing (title + textarea for body)
- Add/Remove buttons (where applicable)
- Save/Cancel buttons

### Phase 5: Replace Hardcoded Content
Replace all hardcoded arrays with state variables.

## Code Pattern for Card-Based Sections

```typescript
// State
const [sectionTitle, setSectionTitle] = useState("Section Title");
const [items, setItems] = useState([
  { title: "Item 1", text: "Content 1" },
  { title: "Item 2", text: "Content 2" }
]);

// Edit UI Pattern
{isEditMode && editingSection === `item-${index}` ? (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium">Card Title</label>
      <Input
        value={editedCardTitle}
        onChange={(e) => setEditedCardTitle(e.target.value)}
      />
    </div>
    <div>
      <label className="block text-sm font-medium">Card Content</label>
      <Textarea
        value={editedText}
        onChange={(e) => setEditedText(e.target.value)}
        className="min-h-[120px]"
      />
    </div>
    <div className="flex gap-2 justify-end">
      <Button onClick={handleCancel}>Cancel</Button>
      <Button onClick={() => handleSaveCard(index)}>Save</Button>
    </div>
  </div>
) : (
  <>
    <h4>{item.title}</h4>
    <p>{item.text}</p>
    {isEditMode && (
      <Button onClick={() => startEditCard(index, item)}>
        <Edit2 />
      </Button>
    )}
  </>
)}
```

## localStorage Structure

```typescript
{
  bioParagraph1: string,
  bioParagraph2: string,
  superPowersTitle: string,
  superPowers: string[],
  highlightsTitle: string,
  highlights: Array<{title: string, text: string}>,
  leadershipTitle: string,
  leadershipItems: Array<{title: string, text: string}>,
  // ... more sections
  lastModified: string
}
```

## Testing Checklist

For each section:
- [ ] Edit button appears in Edit Mode
- [ ] Click edit opens input/textarea
- [ ] Title changes save correctly
- [ ] Content changes save correctly  
- [ ] Cancel restores original
- [ ] localStorage persistence works
- [ ] Page refresh keeps changes
- [ ] Export includes data
- [ ] Import restores data

## Next Steps

1. Locate all remaining sections in About.tsx (lines 624+)
2. Create complete state structure
3. Implement editing UI for each section
4. Test thoroughly
5. Update export/import (already configured in App.tsx)

This is a large implementation but follows consistent patterns throughout.
