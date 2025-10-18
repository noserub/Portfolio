# 🔒 DATA SAFETY GUIDE - How to Never Lose Your Work

## ⚠️ CRITICAL: Follow This Workflow Every Time

### 1. **Making Changes to Skype Qik (or any project)**
- Sign in and switch to Edit Mode
- Navigate to the project and make your changes
- **WAIT** for the green "Changes Saved to localStorage!" message (top right)
- This message will appear for 3 seconds after each save

### 2. **Saving Your Work (REQUIRED AFTER EVERY EDIT SESSION)**
- After seeing "Changes Saved!" message
- Click the **"📥 Export Now"** button (green button in top right)
- A file will download like: `portfolio-backup-2025-10-06T14-30-00.json`
- **Save this file with a descriptive name** like: `portfolio-skype-qik-update-oct6.json`

### 3. **Before Switching to Preview Mode**
- You will see a confirmation dialog
- **ONLY click OK if you've already exported** your latest changes
- If you haven't exported, click Cancel and export first

### 4. **Verifying Your Data**
- Click **"💾 Verify Saved"** button to check what's in localStorage
- Check the console (F12) for detailed information
- Look for your project name and verify image counts

## 📋 Best Practices

### ✅ DO:
1. **Export after EVERY editing session** - Don't skip this!
2. **Keep multiple backup files** with timestamps
3. **Name your files descriptively**: `portfolio-skype-qik-final-oct6.json`
4. **Wait for "Changes Saved!" message** before exporting
5. **Verify before exporting**: Click "💾 Verify Saved" first

### ❌ DON'T:
1. **DON'T import old JSON files** - they will overwrite your new changes!
2. **DON'T switch to Preview Mode** without exporting first
3. **DON'T close the browser** without exporting
4. **DON'T trust localStorage alone** - always have JSON backups
5. **DON'T click Import** unless you're sure the file is newer than your current data

## 🚨 If Your Data Gets Wiped

### Option 1: Import Your Latest Backup
1. Switch to Preview Mode (if in Edit Mode)
2. Click **"📤 Import"** button
3. **IMPORTANT**: Select your MOST RECENT backup file (check the timestamp)
4. Confirm the import warning
5. Page will reload with your data restored

### Option 2: Check Browser LocalStorage Directly
1. Open browser DevTools (F12)
2. Go to "Application" or "Storage" tab
3. Click "Local Storage" → your domain
4. Look for "caseStudies" key
5. Copy the value (it's a big JSON string)
6. Save it to a file for safety

## 🔍 Understanding the Save Flow

```
Edit Project → Auto-Save to Memory → Save to localStorage → Export to JSON File
     ↓              ↓                      ↓                      ↓
  (Your edits)  (2-3 seconds)     (Shows green banner)    (Backup to disk)
                                         ↓
                            WAIT FOR THIS MESSAGE BEFORE EXPORTING!
```

## 📊 Storage Locations (in order of safety)

1. **JSON Backup Files** (SAFEST) ✅
   - Saved to your computer's disk
   - Permanent and portable
   - Can be versioned and named

2. **Browser localStorage** (TEMPORARY) ⚠️
   - Saved in browser memory
   - Can be cleared by browser
   - Lost if you clear browsing data
   - Lost if browser crashes

3. **React State** (VOLATILE) ❌
   - Only exists while page is open
   - Lost on page refresh
   - Lost if browser crashes

## 💡 Pro Tips

### Tip 1: Multiple Backups
Keep at least 3 backup files:
- `portfolio-backup-latest.json` (most recent)
- `portfolio-backup-yesterday.json` (previous day)
- `portfolio-backup-last-week.json` (safety net)

### Tip 2: Verify Before Closing
Before closing the browser:
1. Click "💾 Verify Saved"
2. Click "📥 Export Now"
3. Check the downloaded file size (should be > 50 KB)

### Tip 3: Check File Timestamps
When importing, **always check the file's timestamp** in the filename:
- `portfolio-backup-2025-10-06T14-30-00.json` = Oct 6, 2:30 PM
- Choose the newest file!

### Tip 4: Console Logging
Keep the browser console open (F12) while editing:
- You'll see save confirmations
- You'll see detailed project information
- You'll catch errors early

## 🔧 Troubleshooting

### "My changes disappeared after switching to Preview"
**Cause**: Changes weren't exported to JSON file before switching modes.
**Solution**: Import your most recent JSON backup.

### "Import doesn't restore my latest changes"
**Cause**: You imported an old backup file instead of the newest one.
**Solution**: Check file timestamps and import the most recent file.

### "I don't see 'Changes Saved!' message"
**Cause**: Save might have failed silently.
**Solution**: 
1. Click "💾 Verify Saved" to check if data is there
2. If not there, make a small edit to trigger save again
3. Check console for errors

### "Export button doesn't download anything"
**Cause**: Browser popup blocker or permissions issue.
**Solution**: 
1. Check if download was blocked in address bar
2. Allow downloads from this site
3. Try export again

## 📞 Emergency Recovery

If all else fails and you need to recover Skype Qik data:

1. Check if you have ANY JSON backup files - even old ones
2. Import the most recent one you can find
3. Check browser's download history for auto-downloaded backups
4. Look for `portfolio-backup-*.json` files in your Downloads folder

## ✨ Summary: The Golden Rule

**ALWAYS EXPORT AFTER EDITING**
↓
Wait for "Changes Saved!" → Click "📥 Export Now" → Save the file
↓
**THEN you can safely switch modes or close browser**

---

**Remember**: localStorage is temporary storage. JSON files are your permanent backups. Treat exports like hitting "Save" in a word processor!
