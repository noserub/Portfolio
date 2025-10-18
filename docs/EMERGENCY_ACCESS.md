# 🚨 How to Access Emergency Recovery

## ✅ CORRECT URL SYNTAX

Add `?emergency=true` to your current URL:

### Examples:
- `https://your-site.com/?emergency=true`
- `http://localhost:5173/?emergency=true`
- `https://figma-make.app/?emergency=true`

**Just add `?emergency=true` to the end of your URL!**

---

## 🔧 What Emergency Recovery Does

The emergency page will:
- ✅ Show your current storage usage
- ✅ Display case studies and design projects status
- ✅ Detect corrupted data
- ✅ Warn if storage is almost full (over 4MB)
- ✅ One-click fixes for common issues

---

## 🎯 Quick Fixes Available

### 1. Clear Import Flag & Go Home
**Use this for:** Blank screen after import
- Clears the stuck `freshImport` flag
- Takes you back to homepage
- **Fastest fix for blank screens**

### 2. Auto-Fix Corruption
**Use this for:** Corrupted data errors
- Removes invalid case studies
- Removes invalid design projects
- Keeps all valid data

### 3. Clear All Data
**Use this for:** Storage quota exceeded
- Resets everything to defaults
- Keeps your authentication and theme
- **Use this if storage is over 5MB**

---

## 📊 Your Storage Problem

Based on the error you showed, your storage is **FULL** (QuotaExceededError).

### The Problem:
- You tried to import data that's too large
- Browser limit: ~5-10 MB
- Your data: Probably 5+ MB (images are too large!)

### The Solution:
1. Go to `?emergency=true`
2. Click "Clear All Data"
3. Use **Unsplash URLs** instead of uploading images
4. Each Unsplash URL = ~100 bytes (tiny!)
5. Each uploaded image = 2-4 MB (huge!)

---

## 🖼️ How to Reduce Storage (IMPORTANT!)

### Instead of uploading images:
1. Find image on Unsplash.com
2. Right-click → Copy image address
3. In edit mode, paste the URL (don't upload file!)
4. Repeat for all images

### This will reduce your data from:
- **Before:** 30-60 MB (won't import!)
- **After:** <1 MB (works perfectly!)

---

## ⚡ RIGHT NOW - Do This:

1. **Copy this URL pattern:** `?emergency=true`
2. **Add it to your current URL** (after the domain)
3. **Press Enter**
4. **Click "Clear All Data"**
5. **Rebuild using Unsplash URLs** (not file uploads!)
6. **Export frequently**

---

## 🔗 Other Recovery Options

- `?diagnostic=true` - Full diagnostic page with detailed analysis
- `?recovery=true` - Automatic cleanup (from pre-React loader)

---

## ❓ Still Can't Access It?

If adding `?emergency=true` doesn't work:

1. **Make sure you're adding it to the RIGHT URL**
   - After the domain
   - Before any `#` symbols
   - Example: `mysite.com/?emergency=true`

2. **Try diagnostic mode:**
   - Add `?diagnostic=true` instead
   - Same features, different UI

3. **Use browser console:**
   ```javascript
   localStorage.clear()
   window.location.reload()
   ```

The emergency page is now accessible via URL parameter - just add `?emergency=true` to your URL!
