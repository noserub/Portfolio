# Import Troubleshooting Guide

## Problem: Blank Screen After JSON Import

If you're experiencing a blank screen after importing a JSON file, follow these steps to diagnose and fix the issue.

---

## 🔧 Quick Fix Steps

### Option 1: Use Diagnostic Page (Recommended)
1. Add `?diagnostic=true` to your URL
   - Example: `https://your-site.com/?diagnostic=true`
2. Click "🔄 Run Diagnostics" to see what's wrong
3. Click "🔧 Auto-Repair" to fix corrupted data
4. Click "🏠 Go Home" to return to the site

### Option 2: Use Browser Console
1. Open browser DevTools (F12)
2. Go to the Console tab
3. Type: `window.runDiagnostics()`
4. Review the diagnostic output
5. Type: `window.autoRepair()` to fix issues
6. Reload the page

### Option 3: Recovery Mode
1. Add `?recovery=true` to your URL
   - Example: `https://your-site.com/?recovery=true`
2. This will clear corrupted data while preserving your authentication and theme
3. You'll be redirected to a clean homepage

### Option 4: Complete Reset (Last Resort)
1. Open browser DevTools (F12)
2. Go to Console tab
3. Type: `localStorage.clear()`
4. Reload the page
5. All data will be reset to defaults

---

## 📊 Understanding the Diagnostic Tools

### Pre-React Loading Indicator
When you reload the page, you should see:
- A loading spinner
- Status messages like "Checking localStorage...", "Validating imported data..."
- If the page takes more than 10 seconds to load, you'll see an error with recovery options

### Full Diagnostics Report
Run `window.runDiagnostics()` in the console to see:
- ✅ localStorage accessibility
- 📦 Total storage used
- 🔍 Validation of each data item (case studies, design projects, hero text)
- ❌ List of any corruption issues found
- 📋 Detailed structure of your data

### Auto-Repair Function
Run `window.autoRepair()` in the console to:
- Automatically detect corrupted data
- Remove invalid JSON
- Remove data that's not in the expected format
- Preserve all valid data

---

## 🐛 Common Issues & Solutions

### Issue: "Import successful" message but no data visible
**Cause:** You were signed out during import, so you can't see the edit mode content.

**Solution:**
1. Sign in using the overflow menu (⋮) or theme toggle button
2. The password is: `brian2025`
3. Your imported data will now be visible

### Issue: Blank screen immediately after import
**Cause:** Data corruption or invalid JSON format.

**Solution:**
1. Open browser console (F12)
2. Look for red error messages
3. Run `window.autoRepair()`
4. Reload the page

### Issue: "localStorage verification failed after write"
**Cause:** Browser security settings or storage quota exceeded.

**Solution:**
1. Check your browser's storage settings
2. Clear some data to free up space
3. Try importing a smaller JSON file
4. Check if your browser allows localStorage for this site

### Issue: Import seems to hang/freeze
**Cause:** Very large JSON file or slow browser.

**Solution:**
1. Wait for the pre-React loader to show an error (max 10 seconds)
2. Use Recovery Mode: add `?recovery=true` to URL
3. Try importing smaller chunks of data

---

## 🔍 Step-by-Step Import Process

Here's what happens when you import:

1. **You click "Import"** → File dialog opens
2. **You select a JSON file** → File is read
3. **JSON is parsed** → Validates format
4. **Data is validated** → Checks arrays, objects, structure
5. **Data is written to localStorage** → Immediate verification
6. **Page reloads** → Fresh start with new data
7. **Pre-React checks run** → Validates data before React loads
8. **React mounts** → App renders with new data
9. **Success indicator shows** → Green notification for 8 seconds

At each step, detailed logs are written to the browser console. Open DevTools (F12) to see them.

---

## 💾 Best Practices

### Before Importing:
1. ✅ **Always export your current data first!**
2. ✅ Make sure you're signed in (you'll stay signed in after import)
3. ✅ Close other tabs using the same site (prevents conflicts)
4. ✅ Check the JSON file isn't corrupted (open it in a text editor)

### During Import:
1. ⏳ Wait for the confirmation dialog
2. ⏳ Wait for the "Import complete - reloading" message in console
3. ⏳ Don't close the browser or tab during reload
4. ⏳ Keep DevTools console open to see any errors

### After Import:
1. ✅ Check the console for "Import successful!" message
2. ✅ Verify your data appears correctly
3. ✅ Export immediately to create a backup of the imported data
4. ✅ Test navigation and functionality

---

## 📝 Console Commands Reference

```javascript
// Run full diagnostics
window.runDiagnostics()

// Auto-repair corrupted data
window.autoRepair()

// Check what's in localStorage
Object.keys(localStorage)

// View specific data
JSON.parse(localStorage.getItem('caseStudies'))

// Clear everything
localStorage.clear()

// Clear just case studies
localStorage.removeItem('caseStudies')
```

---

## 🚨 Emergency Recovery

If nothing else works:

1. **Save any visible content** by copying it to a text file
2. **Open DevTools** (F12)
3. **Run:** `localStorage.clear()`
4. **Reload the page**
5. **Sign in** with password: `brian2025`
6. **Recreate your content** or import from a known-good backup

---

## 📞 Getting Help

If you're still stuck:

1. Open browser console (F12)
2. Run: `window.runDiagnostics()`
3. Copy the entire console output
4. Take screenshots of any error messages
5. Note what you were trying to import (file size, data type)
6. Share this information for debugging

---

## ✅ Verification Checklist

After a successful import, you should see:

- [ ] Green "Import Successful!" notification
- [ ] No red errors in console
- [ ] Your case studies appear on the home page (in edit mode)
- [ ] Navigation works correctly
- [ ] You're still signed in
- [ ] Theme is preserved
- [ ] All images load correctly

If any of these fail, use the diagnostic tools above to investigate.
