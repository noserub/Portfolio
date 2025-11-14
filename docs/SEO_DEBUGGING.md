# SEO Debugging Guide

## Testing Structured Data (JSON-LD)

### Google Rich Results Test
1. Visit: https://search.google.com/test/rich-results
2. Enter your URL
3. Check the console for any errors

### Common Issues

**"No items detected"**
- Check browser console for SEO injection logs
- Look for: `✅ SEO: Injected structured data schema`
- Verify the page is using `useSEO()` hook
- Check that `getSEOData()` returns valid data

**Debug Steps:**
1. Open browser DevTools → Console
2. Look for logs starting with `🔍 SEO:` or `✅ SEO:`
3. Check if structured data scripts are in `<head>`:
   ```javascript
   document.querySelectorAll('script[type="application/ld+json"]')
   ```
4. Verify JSON is valid:
   ```javascript
   const scripts = document.querySelectorAll('script[type="application/ld+json"]');
   scripts.forEach(s => {
     try {
       JSON.parse(s.textContent);
       console.log('✅ Valid JSON');
     } catch(e) {
       console.error('❌ Invalid JSON:', e);
     }
   });
   ```

## Testing Twitter Cards

### Twitter Card Validator
1. Visit: https://cards-dev.twitter.com/validator
2. Enter your URL
3. Check for errors

### Required Meta Tags
Twitter requires these meta tags:
- `twitter:card` (summary_large_image or summary)
- `twitter:title`
- `twitter:description`
- `twitter:image` (required for summary_large_image)

### Debug Steps:
1. Check meta tags in browser:
   ```javascript
   // Check all Twitter meta tags
   document.querySelectorAll('meta[name^="twitter:"]').forEach(m => {
     console.log(m.name, '=', m.content);
   });
   ```

2. Verify all required tags are present:
   ```javascript
   const required = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];
   required.forEach(name => {
     const tag = document.querySelector(`meta[name="${name}"]`);
     if (!tag || !tag.content) {
       console.error(`❌ Missing or empty: ${name}`);
     } else {
       console.log(`✅ ${name}: ${tag.content}`);
     }
   });
   ```

## Common Fixes

### Issue: Structured data not appearing
**Solution:** 
- Ensure page component calls `useSEO()` hook
- Check that SEO data exists in localStorage or Supabase
- Verify `siteUrl` in SEO settings is correct

### Issue: Twitter Card shows "No card found"
**Solution:**
- Ensure all required meta tags are present
- Check that `twitter:image` URL is accessible
- Verify image URL returns 200 status code
- Make sure image is at least 300x157px (for summary) or 1200x630px (for summary_large_image)

### Issue: OG image not showing
**Solution:**
- Check `/api/og` endpoint is accessible
- Verify the OG image API returns valid image
- Check image dimensions (should be 1200x630px)

## Testing Checklist

- [ ] Open page in browser
- [ ] Check browser console for SEO logs
- [ ] Verify structured data scripts in `<head>`
- [ ] Test with Google Rich Results Test
- [ ] Test with Twitter Card Validator
- [ ] Verify all meta tags are present
- [ ] Check OG image is accessible
- [ ] Verify canonical URLs are correct

