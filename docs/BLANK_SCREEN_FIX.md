# 🚨 BLANK SCREEN FIX - IMMEDIATE SOLUTION

## If you see a blank screen after import:

### Option 1: Emergency Recovery Page (RECOMMENDED)
1. **Go to:** `/emergency.html`
2. **Click:** "🔧 Auto-Fix Corruption"
3. **Click:** "🏠 Go to App"

That's it! This will fix 99% of issues.

---

### Option 2: Manual Fix
1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Type: `localStorage.removeItem('freshImport')`
4. Type: `window.location.reload()`

---

### Option 3: Nuclear Option
1. Press **F12**
2. Console tab
3. Type: `localStorage.clear()`
4. Type: `window.location.reload()`
5. You'll need to re-import your data

---

## Direct Links

- **Emergency Recovery:** `/emergency.html`
- **Diagnostic Page:** `/?diagnostic=true`
- **Recovery Mode:** `/?recovery=true`

---

## Most Common Cause

The `freshImport` flag gets stuck in localStorage. The emergency page clears it automatically.

---

## Prevention

1. Always sign in BEFORE importing
2. Keep browser DevTools open during import
3. Export your data frequently
4. Don't close the browser during import

---

## Still Not Working?

1. Go to `/emergency.html`
2. Click "Run Full Diagnostics"
3. Copy the output
4. Share it for debugging

The emergency page will show you exactly what's wrong and can fix most issues with one click.
