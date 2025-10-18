# Favicon Customization Guide

## Overview
Your portfolio site now includes a fully customizable favicon system with TWO options: generate a text-based favicon or upload your own custom image. The favicon appears in browser tabs, bookmarks, history, and mobile home screens.

## Default Favicon
By default, the site uses a **text-based favicon** with:
- **Text**: "BB" (Brian Bureson's initials)
- **Gradient Start Color**: #8b5cf6 (Purple)
- **Gradient End Color**: #3b82f6 (Blue)

## How to Customize

### Via SEO Editor
1. Enter **Edit Mode** (click "Edit" in the header)
2. Click the **overflow menu** (⋯) in the top right
3. Select **"SEO Settings"**
4. Go to the **"Site Settings"** tab
5. Scroll down to **"Favicon Customization"** section

## Two Favicon Options

### Option 1: Text Favicon (Generated)
Generate a favicon automatically with custom text and gradient colors.

#### Favicon Text
- Enter 1-3 characters (e.g., "BB", "B", "👋")
- Supports letters, numbers, and emojis
- Appears centered in the favicon

#### Gradient Colors
- **Start Color**: Top-left gradient color (default: purple #8b5cf6)
- **End Color**: Bottom-right gradient color (default: blue #3b82f6)
- Use the color pickers or enter hex values manually

### Option 2: Custom Image Upload
Upload your own logo or image to use as the favicon.

#### Supported Formats
- PNG (recommended)
- JPG/JPEG
- SVG
- ICO (legacy format)

#### Image Requirements
- **Recommended Size**: 32x32 or 64x64 pixels
- **Maximum File Size**: 500KB
- **Shape**: Square images work best
- **Transparency**: Supported in PNG and SVG formats

#### How to Upload
1. Select **"Custom Image"** radio button
2. Click **"Choose Image File"** button
3. Select your image file
4. Preview will update automatically
5. Click **"Save Changes"** to apply

#### Preview
- Live preview shows exactly how your favicon will look
- Preview displays at 64x64 pixels (4x actual browser size)
- Works for both text and image favicons

## Technical Details

### SVG-Based
- Uses SVG for crisp rendering at any size
- Automatically generates data URIs
- No external files needed

### Browser Support
- Modern browsers: Full SVG favicon support
- Older browsers: Fallback to PNG data URI
- iOS/Safari: Apple Touch Icon for home screen

### Files Modified
- `/index.html` - Default favicon setup
- `/utils/seoManager.ts` - Favicon generation logic
- `/components/SEOEditor.tsx` - Customization UI
- `/hooks/useSEO.ts` - Dynamic favicon updates

## Applying Changes
After customizing your favicon:
1. Click **"Save Changes"** in the SEO Editor
2. The page will **reload automatically**
3. Your new favicon will appear in browser tabs
4. May take a few seconds for browser cache to update

## Tips

### For Light Backgrounds
Use darker gradients for better contrast on light-colored browser themes.

### For Dark Backgrounds
Use brighter gradients for better visibility on dark-colored browser themes.

### Single Character
Using a single character (like "B") will appear larger and more prominent.

### Emojis
Emojis work but may render inconsistently across different browsers and devices.

### Brand Colors
Use your brand's primary colors to match your site's design system.

## Managing Your Favicon

### Switching Between Types
- Simply select the radio button for the type you want
- Changes take effect after saving and reloading

### Removing Custom Image
- Click the **"Remove"** button (trash icon) next to the upload button
- This switches back to the text-based favicon
- Your text favicon settings are preserved

### Updating Custom Image
- Upload a new image to replace the current one
- The new image immediately replaces the old one
- Previous image is automatically removed from storage

## Troubleshooting

### Favicon Not Updating
1. **Hard Refresh**: Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Clear Cache**: Clear browser cache and reload
3. **Close Tab**: Close and reopen the tab
4. **Restart Browser**: Completely restart your browser

### Image Upload Errors

**"Invalid file type" Error**
- Ensure you're using PNG, JPG, SVG, or ICO format
- Check file extension matches actual format

**"File too large" Error**
- Resize your image to 32x32 or 64x64 pixels
- Compress the image using an online tool
- Convert to PNG format for better compression

**Image Not Displaying**
- Try a different file format (PNG recommended)
- Ensure image isn't corrupted
- Check that image has content (not transparent/blank)

### Text Favicon Issues

**Text Not Visible**
- Ensure text color contrasts well with gradient colors
- Try lighter or darker gradient colors
- The text is always white (#ffffff)

**Colors Not Appearing**
- Make sure you're using valid hex color codes
- Format: #RRGGBB (e.g., #8b5cf6)
- Click "Save Changes" to apply

## Best Practices

### For Text Favicons
- **Keep it short**: 1-2 characters work best (e.g., "BB", "B")
- **Use brand colors**: Match your site's color scheme
- **High contrast**: Ensure gradient colors contrast well with each other
- **Test visibility**: View in both light and dark browser themes

### For Image Favicons
- **Simple designs**: Detailed images don't work well at small sizes
- **High contrast**: Ensure logo is visible against various backgrounds
- **Transparent backgrounds**: Use PNG with transparency for flexibility
- **Square format**: Non-square images will be letterboxed
- **Test at small sizes**: View your image at 16x16 and 32x32 pixels before uploading

## Storage Information

### Text Favicons
- Generated on-the-fly using SVG
- No storage space used
- Settings stored in localStorage (~50 bytes)

### Image Favicons
- Stored as base64 data URI in localStorage
- Typical sizes:
  - 32x32 PNG: ~2-5 KB
  - 64x64 PNG: ~5-10 KB
  - SVG: 1-10 KB (depending on complexity)
- Maximum allowed: 500 KB

### Data Persistence
- Favicon settings stored in browser localStorage
- Persists across sessions
- Specific to your browser/device
- Not synced between devices
- Cleared if browser data is cleared

## Future Enhancements
When migrating to Supabase, you could add:
- Store images on server instead of localStorage
- Different favicons for different pages
- Animated favicons (GIF or animated SVG)
- Light/dark mode variants
- Multiple favicon options to choose from
- Preview in different browser contexts
