# Data Recovery & Backup Guide

## 🚨 What Happened: Data Loss After Figma Make Restart

When Figma Make reboots or refreshes, your data stored in **localStorage** can sometimes be cleared depending on the browser/environment. This is a known limitation of browser-based storage.

---

## ✅ What We Fixed

### 1. **Auto-Initialize with Sample Data**
- When no case studies exist, the app now automatically creates a **Sample Case Study**
- This sample includes:
  - ✅ **4 placeholder images** in Project Images gallery
  - ✅ **2 placeholder images** in Flow Diagrams gallery
  - ✅ **Template markdown content** for all sections

### 2. **Welcome Message**
- On first load, you'll see a welcome dialog explaining the sample case study
- Option to sign in immediately to start editing

### 3. **Placeholder Image System**
- Placeholder images show as **colorful gradient backgrounds with camera icons**
- These are temporary and meant for testing the gallery UI
- They will disappear on page reload (this is expected behavior in Placeholder Mode)

---

## 💾 CRITICAL: How to Prevent Data Loss

### **The Golden Rule: EXPORT FREQUENTLY!**

Since Figma Make uses browser localStorage (which can be cleared), you MUST export your data regularly.

### **Export Workflow:**

1. **After Making Changes:**
   - Wait for "✅ Changes Saved to localStorage!" message
   - Click **"📥 Export Now"** button (top right in Edit Mode or Preview Mode)
   - Save the JSON file with a descriptive name: `portfolio-2025-01-07-v1.json`

2. **Save Multiple Versions:**
   ```
   portfolio-2025-01-07-morning.json
   portfolio-2025-01-07-afternoon.json
   portfolio-2025-01-07-final.json
   ```

3. **Keep Backups:**
   - Save to your computer
   - Email to yourself
   - Save to cloud storage (Dropbox, Google Drive, etc.)

---

## 🔄 How to Recover Lost Data

### **Option 1: Import from Backup** ✅ (Recommended)

1. Click **"📤 Import"** button (top right)
2. Select your most recent `.json` export file
3. Confirm the import
4. Page will reload with your data restored

### **Option 2: Start Fresh**

If you have no backup:
1. The app auto-creates a **Sample Case Study** with placeholder images
2. Sign in (password: `brian2025`)
3. Switch to Edit Mode
4. Create your content from scratch
5. **EXPORT IMMEDIATELY!**

---

## 🖼️ About Placeholder Images

### **What They Are:**
- Colorful gradient backgrounds (pink → purple → blue → cyan → yellow)
- White camera icon (80×80px) centered
- URLs like `blob:placeholder-1`, `blob:placeholder-2`, etc.

### **Why They Exist:**
- **Testing Mode** - Test gallery features without using storage
- **Pre-Supabase** - Placeholder until you integrate Supabase for permanent image storage
- **Zero Storage** - Don't save to localStorage (keeps exports small)

### **How They Work:**
1. **New case study created** → Gets 4 + 2 placeholder images automatically
2. **Upload real image** → Replaces placeholder (creates blob URL)
3. **Page reload** → Blob URLs expire → Placeholder camera icon shows
4. **Export** → Placeholder images are NOT included in export (by design)

### **When to Upload Real Images:**
- **NOT NOW** - Placeholder mode is for testing
- **LATER** - When you integrate Supabase or external image hosting
- **WHY?** - Blob URLs are temporary and will disappear on reload

---

## 📋 Daily Workflow Checklist

### **Every Editing Session:**

- [ ] Sign in to Edit Mode
- [ ] Make your changes
- [ ] Wait for "Changes Saved!" message
- [ ] Click "📥 Export Now"
- [ ] Save with date/version in filename
- [ ] Continue editing or sign out

### **Before Closing Figma Make:**

- [ ] Export one final time
- [ ] Verify the .json file downloaded
- [ ] (Optional) Email backup to yourself

### **If Figma Make Crashes/Refreshes:**

- [ ] Don't panic!
- [ ] Check if data is still there (refresh page)
- [ ] If data is gone, import from your latest export
- [ ] Resume working

---

## 🎯 Quick Recovery Steps

### **"I just lost all my data!"**

1. **Stay calm** - Your exports are your backup
2. Click **"📤 Import"**
3. Select your most recent `.json` file
4. Data restored!

### **"I have no exports!"**

1. **Accept the loss** - Start fresh with Sample Case Study
2. **Lesson learned** - Export frequently from now on
3. **New rule** - Export after EVERY editing session

### **"Placeholder images disappeared!"**

1. **This is normal** - Blob URLs expire on reload
2. **Not a bug** - Expected behavior in Placeholder Mode
3. **Solution** - Upload fresh images each session (for testing)
4. **Future** - Integrate Supabase for permanent storage

---

## 🚀 Future: Supabase Integration

### **Why Supabase?**
- **Permanent storage** - Images never disappear
- **Real URLs** - `https://...` instead of `blob:...`
- **No quota limits** - Not constrained by browser storage
- **Better performance** - CDN-delivered images

### **When Ready:**
1. Set up Supabase account
2. Upload images to Supabase Storage
3. Replace blob URLs with Supabase URLs
4. Export your data with real URLs

---

## ⚠️ Warning Signs of Data Loss

Watch for these signals:

- ❌ **"Sample Case Study" appears** - Your data was cleared
- ❌ **All case studies gone** - localStorage was wiped
- ❌ **Welcome message shows** - First load detected
- ❌ **Export file is tiny** - Images weren't saved (normal in Placeholder Mode)

### **If You See These:**
1. **DON'T PANIC**
2. Import from your latest export
3. Resume working
4. Export again

---

## 💡 Pro Tips

1. **Export naming convention:**
   ```
   portfolio-backup-YYYY-MM-DD-HHmm.json
   portfolio-backup-2025-01-07-1430.json
   ```

2. **Keep at least 3 versions:**
   - Latest
   - Previous day
   - Older backup

3. **Export before major changes:**
   - Before deleting content
   - Before importing new data
   - Before experimenting with features

4. **Set a reminder:**
   - Export at the end of each editing session
   - Export before closing Figma Make
   - Export before signing out

---

## 🆘 Emergency Contacts

### **If Nothing Works:**

1. Go to `/emergency.html`
2. Use Emergency Recovery tools
3. Try "Import from File"
4. Check console logs for errors

### **localStorage Debugging:**

1. Open browser console (F12)
2. Type: `localStorage.getItem('caseStudies')`
3. See if your data is actually there
4. If it exists, try refreshing the page

---

## ✅ Summary

**MOST IMPORTANT:**
- 📥 **EXPORT FREQUENTLY** - After every editing session
- 💾 **KEEP BACKUPS** - Multiple versions in safe places
- 🔄 **TEST IMPORTS** - Verify your exports work

**Remember:**
- Placeholder images = Testing mode
- Blob URLs = Temporary (will disappear)
- Exports = Your safety net
- Supabase = Future permanent solution

**The app is working correctly!** The Sample Case Study with placeholder images is the expected behavior when starting fresh. You just need to import your backup to restore your actual content.
