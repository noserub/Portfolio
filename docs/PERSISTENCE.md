# Data Persistence Guide

## Overview
All changes you make to your portfolio are automatically saved to your browser's localStorage and will persist across page refreshes and new builds.

## What Gets Saved

### ✅ Automatically Persisted Data

1. **Logo**
   - Saved immediately when uploaded
   - Stored as base64 data URL
   - Location: `localStorage.getItem('logo')`

2. **Case Study Projects**
   - All project data including:
     - Hero images (url, scale, position)
     - Titles and descriptions
     - Case study content (markdown)
     - Gallery images with their adjustments
   - Saved automatically on every change
   - Location: `localStorage.getItem('caseStudies')`

3. **Design Projects**
   - Same data as case studies
   - Location: `localStorage.getItem('designProjects')`

4. **Image Adjustments**
   - Hero image zoom and position
   - Gallery image zoom and position
   - All saved with the project data

## How It Works

### Automatic Saving
Every time you make a change:
1. The change updates the project state
2. React's `useEffect` detects the change
3. Data is serialized to JSON
4. Saved to localStorage
5. Green "Changes saved!" indicator appears (for 2 seconds)

### Console Logging
Check your browser console to see save confirmations:
```
✅ Case studies saved to localStorage: X projects
✅ Design projects saved to localStorage: Y projects
```

## Data Safety

### Backup Your Data
To export your data for backup:
```javascript
// Open browser console (F12) and run:
const data = {
  logo: localStorage.getItem('logo'),
  caseStudies: localStorage.getItem('caseStudies'),
  designProjects: localStorage.getItem('designProjects')
};
console.log(JSON.stringify(data));
// Copy the output and save to a file
```

### Restore from Backup
```javascript
// In browser console:
const data = /* paste your backup data here */;
localStorage.setItem('logo', data.logo);
localStorage.setItem('caseStudies', data.caseStudies);
localStorage.setItem('designProjects', data.designProjects);
location.reload();
```

### Reset to Defaults
Click the "Reset Data" button (visible in Preview Mode when signed in) to clear all changes and restore defaults.

## Storage Limits

localStorage has a 5-10MB limit per domain. Large base64 images can fill this quickly.

### Current Storage Usage
Check in console:
```javascript
const used = JSON.stringify(localStorage).length;
console.log(`Using ${(used / 1024 / 1024).toFixed(2)} MB of storage`);
```

### Tips to Optimize Storage
1. **Compress images before upload** - Use tools like TinyPNG
2. **Use appropriate dimensions** - 1920px wide max for hero images
3. **Limit gallery images** - 6-8 images per case study is ideal

## Troubleshooting

### Changes Not Saving?
1. Check browser console for errors
2. Verify localStorage isn't disabled
3. Check storage quota isn't exceeded
4. Try incognito mode to test

### Data Lost After Refresh?
1. Check if localStorage was cleared
2. Verify you're on the same domain
3. Check browser privacy settings
4. Look for localStorage errors in console

### "Quota Exceeded" Error?
1. Reduce image file sizes
2. Remove unused images
3. Use "Reset Data" to start fresh
4. Consider external image hosting

## Best Practices

### ✅ DO
- Save a backup before major changes
- Compress images before uploading
- Test changes in Preview Mode
- Monitor console for save confirmations

### ❌ DON'T
- Upload very large images (>2MB)
- Clear browser data without backing up
- Use localStorage for sensitive data
- Ignore storage quota warnings

## Technical Details

### Data Structure
```typescript
interface ProjectData {
  id: string;
  url: string;                    // Hero image (base64 or URL)
  title: string;
  description: string;
  position: { x: number; y: number };  // Hero image position %
  scale: number;                   // Hero image zoom level
  published: boolean;
  caseStudyContent?: string;       // Markdown content
  caseStudyImages?: Array<{
    id: string;
    url: string;                   // Base64 or URL
    alt: string;
    scale?: number;                // Image zoom level
    position?: { x: number; y: number };  // Image position %
  }>;
}
```

### Save Triggers
Changes are saved automatically when:
- Hero image is changed/adjusted
- Gallery image is added/removed/adjusted
- Title/description is edited
- Case study content is updated
- Images are reordered
- Any project property changes

### Performance
- Saves are debounced (no delay, but batched)
- Only changed projects are re-serialized
- Console logs can be removed in production

## Support

If you experience persistent issues:
1. Clear localStorage: `localStorage.clear()`
2. Refresh the page
3. Re-upload your content
4. Check browser console for errors
5. Verify browser supports localStorage
