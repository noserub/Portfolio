# 🚀 Quick Import Guide

## ✅ Normal Import Process

1. **Sign in** (password: `brian2025`)
2. **Export current data** (📥 Export Now button)
3. **Click Import** (📤 Import button)
4. **Select your JSON file**
5. **Wait for reload** (about 2-3 seconds)
6. **Look for green "Import Successful!" message**
7. **Verify your data appears**

---

## 🔧 If You Get a Blank Screen

### Quick Fix #1: Wait 10 Seconds
The system will automatically show an error page with recovery options.

### Quick Fix #2: Diagnostic Page
1. Add `?diagnostic=true` to your URL
2. Click "🔧 Auto-Repair"
3. Click "🏠 Go Home"

### Quick Fix #3: Browser Console
1. Press F12
2. Type: `window.autoRepair()`
3. Reload page

### Quick Fix #4: Recovery Mode
1. Add `?recovery=true` to your URL
2. Wait for auto-cleanup
3. Start fresh

---

## 🔍 Diagnostic Tools

### Visual Interface:
```
https://your-site.com/?diagnostic=true
```

### Console Commands:
```javascript
window.runDiagnostics()  // See what's wrong
window.autoRepair()       // Fix it automatically
```

---

## ⚠️ Emergency Reset

```javascript
localStorage.clear()      // Clear everything
window.location.reload()  // Reload page
```

---

## 📞 What to Check

Open browser console (F12) and look for:
- ✅ Green messages = Good
- ❌ Red errors = Problem found
- 🔍 "Fresh import detected" = Import is being processed
- ✅ "Import successful!" = Everything worked
- ❌ "Corruption detected" = Auto-repair will fix it

---

## 💡 Pro Tips

- Keep DevTools (F12) open during import to see progress
- Always export before importing
- Stay signed in during import (you won't be signed out anymore)
- Wait for the green success message before doing anything else
- If in doubt, run `window.runDiagnostics()` to see what's going on
