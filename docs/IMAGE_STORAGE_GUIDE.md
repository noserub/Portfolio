# Image Storage Guide

This portfolio app now uses **placeholder images** instead of storing base64-encoded images in localStorage. This keeps your JSON exports small (~100KB) and prevents storage quota errors.

## Current Setup

### What's Happening Now

1. **When you upload an image:**
   - The file is processed by `uploadImage()` in `/utils/imageHelpers.ts`
   - A **blob URL** is created so you see your actual image
   - The blob URL is temporary (lasts for your session)
   - Only the URL is stored in memory (not base64 data)

2. **When you export data:**
   - All base64 images and blob URLs are automatically stripped
   - Replaced with placeholder URLs (Unsplash)
   - File size reduced by 90-99%

3. **Storage locations:**
   - `logo` - Site logo
   - `project.url` - Hero/cover images for case studies
   - `project.caseStudyImages` - Project images gallery
   - `project.flowDiagramImages` - Flow diagram gallery

### Benefits

✅ **Small JSON files** - ~100KB instead of 10MB+  
✅ **No quota errors** - localStorage limits won't be hit  
✅ **Fast imports/exports** - No processing huge base64 strings  
✅ **Easy to upgrade** - Ready for real image storage when needed  

## How to Add Real Image Storage

When you're ready to store actual images, follow these steps:

### Option 1: Supabase Storage (Recommended)

Supabase provides free image hosting with a generous free tier.

#### 1. Set up Supabase

```bash
# Install Supabase client
npm install @supabase/supabase-js
```

#### 2. Create a storage bucket

1. Go to https://supabase.com and create a project
2. Navigate to Storage → Create bucket
3. Name it `portfolio-images`
4. Set to **Public** (so images can be viewed without auth)

#### 3. Update `uploadImage()` function

Edit `/utils/imageHelpers.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);

export async function uploadImage(
  file: File, 
  category: 'portrait' | 'landscape' | 'hero' | 'diagram' = 'landscape'
): Promise<string> {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${category}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    
    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from('portfolio-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('portfolio-images')
      .getPublicUrl(fileName);
    
    return publicUrl;
  } catch (error) {
    console.error('Upload failed:', error);
    // Fallback to placeholder if upload fails
    return generatePlaceholderUrl(file, category);
  }
}
```

#### 4. Add environment variables (recommended)

Create `.env` file:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Then use in code:

```typescript
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Option 2: Cloudinary

Cloudinary is another popular choice with a generous free tier.

#### 1. Set up Cloudinary

```bash
npm install cloudinary
```

#### 2. Update `uploadImage()` function

```typescript
export async function uploadImage(
  file: File, 
  category: 'portrait' | 'landscape' | 'hero' | 'diagram' = 'landscape'
): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'YOUR_UPLOAD_PRESET'); // Create this in Cloudinary dashboard
    formData.append('folder', `portfolio/${category}`);
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Upload failed:', error);
    return generatePlaceholderUrl(file, category);
  }
}
```

### Option 3: AWS S3

For more control and scalability.

#### 1. Install AWS SDK

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

#### 2. Update `uploadImage()` function

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'YOUR_ACCESS_KEY',
    secretAccessKey: 'YOUR_SECRET_KEY',
  },
});

export async function uploadImage(
  file: File, 
  category: 'portrait' | 'landscape' | 'hero' | 'diagram' = 'landscape'
): Promise<string> {
  try {
    const key = `${category}/${Date.now()}-${file.name}`;
    
    await s3Client.send(new PutObjectCommand({
      Bucket: 'your-bucket-name',
      Key: key,
      Body: file,
      ContentType: file.type,
      ACL: 'public-read',
    }));
    
    return `https://your-bucket-name.s3.amazonaws.com/${key}`;
  } catch (error) {
    console.error('Upload failed:', error);
    return generatePlaceholderUrl(file, category);
  }
}
```

### Option 4: Your Own Backend

If you have your own server:

```typescript
export async function uploadImage(
  file: File, 
  category: 'portrait' | 'landscape' | 'hero' | 'diagram' = 'landscape'
): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    
    const response = await fetch('https://your-backend.com/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${YOUR_TOKEN}`,
      },
      body: formData,
    });
    
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Upload failed:', error);
    return generatePlaceholderUrl(file, category);
  }
}
```

## Migration Guide

### Migrating Existing Data

If you have existing data with placeholder images and want to upload real images:

1. **Export your current data** with placeholders
2. **Implement real image storage** (choose option above)
3. **Re-upload images manually** through the UI
4. **Export again** - now with real image URLs

### Testing the Integration

1. **Upload a test image** in Edit Mode
2. **Check browser console** for upload logs
3. **Verify the URL** is from your service (not Unsplash)
4. **Export data** and check the JSON file
5. **Import on another device** to verify images load

## Security Considerations

### Public vs Private Images

- **Public buckets** - Faster, simpler, no auth needed
- **Private buckets** - More secure, requires signed URLs

For a portfolio site, **public buckets** are usually fine since content is meant to be public anyway.

### API Keys

⚠️ **Never commit API keys to git!**

Use environment variables:
- `.env` file for local development (add to `.gitignore`)
- Environment variables in your hosting platform (Netlify, Vercel, etc.)

### Rate Limiting

Consider implementing:
- **File size limits** (e.g., max 5MB)
- **File type validation** (only images)
- **Upload rate limiting** (prevent abuse)

Example:

```typescript
export async function uploadImage(file: File, category): Promise<string> {
  // Validate file size
  if (file.size > 5 * 1024 * 1024) {
    alert('File too large. Maximum size is 5MB.');
    throw new Error('File too large');
  }
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file.');
    throw new Error('Invalid file type');
  }
  
  // Proceed with upload...
}
```

## Cost Estimates

### Supabase
- **Free tier:** 1GB storage, 2GB bandwidth/month
- **Pro plan:** $25/month for 100GB storage

### Cloudinary
- **Free tier:** 25GB storage, 25GB bandwidth/month
- **Paid plans:** Start at $89/month

### AWS S3
- **Pricing:** $0.023/GB/month storage, $0.09/GB transfer
- **Estimate:** ~$5/month for typical portfolio

## Troubleshooting

### Images not loading

1. **Check CORS settings** on your storage bucket
2. **Verify URLs** are publicly accessible
3. **Check browser console** for errors

### Uploads failing

1. **Verify API keys** are correct
2. **Check file size limits**
3. **Ensure bucket/folder exists**
4. **Check network connection**

### Quota exceeded

If you still hit localStorage quota:
1. **Reduce image quality** in your upload service
2. **Use image transformations** (resize, compress)
3. **Consider external content storage**

## Questions?

Check the helper functions in `/utils/imageHelpers.ts` - they're well-documented with examples.

Remember: The current placeholder system works great for development and testing. Add real image storage when you're ready to deploy!
