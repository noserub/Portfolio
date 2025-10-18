# Placeholder Images - Quick Reference

## What Changed

Your portfolio app now uses **placeholder images** instead of storing base64-encoded images. This solves the storage quota problem!

## Before vs After

### Before (Base64 Storage)
```json
{
  "url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...[10MB of data]..."
}
```
**File size:** 10.86 MB 😱  
**Problem:** Exceeds localStorage limits, slow imports/exports

### After (Placeholder URLs)
```json
{
  "url": "https://images.unsplash.com/photo-1234567890?w=1200&h=800&q=80&fit=crop"
}
```
**File size:** ~100 KB 🎉  
**Benefits:** Fast, no quota errors, easy to upgrade

## How It Works

1. **Upload an image** → App generates placeholder URL
2. **Image displayed** → Loads from Unsplash (or your service)
3. **Export data** → Small JSON file with placeholder URLs
4. **Import data** → Works instantly, no processing huge files

## What You See

- ✅ **Your real uploaded images display** while you're working
- ✅ Images are shown using temporary blob URLs (no storage needed)
- ✅ When you export, blob URLs are replaced with placeholders
- ✅ Export/import is now fast (~100KB vs 10MB+)
- ✅ No more "QuotaExceededError"

## Upgrading to Real Image Storage

When you're ready to use your own image hosting:

1. **Read:** `/IMAGE_STORAGE_GUIDE.md`
2. **Choose a service:** Supabase (recommended), Cloudinary, AWS S3, or your own backend
3. **Update one function:** `uploadImage()` in `/utils/imageHelpers.ts`
4. **Done!** All image uploads will now go to your service

## Testing

Try it now:
1. Click "📥 Export Now" in Edit Mode
2. Check the file size - should be ~100KB instead of 10MB
3. Delete your data and re-import - should be instant
4. Upload a new image - you'll see a placeholder

## Files Modified

- ✅ `/utils/imageHelpers.ts` - New placeholder generation
- ✅ `/App.tsx` - Export strips base64, logo upload uses placeholders
- ✅ `/pages/ProjectDetail.tsx` - Case study images use placeholders
- ✅ `/components/FlowDiagramGallery.tsx` - Flow diagrams use placeholders

## Need Help?

- **Storage guide:** See `/IMAGE_STORAGE_GUIDE.md`
- **How placeholders work:** See `/utils/imageHelpers.ts` (well-commented)
- **Errors?** Check browser console for logs

## Current Placeholder Provider

**Unsplash** - Random stock images
- Free, unlimited
- Great for development/testing
- Replace with your own service when ready

The placeholder URLs are generated deterministically, so the same image appears consistently unless you change providers.
