#!/usr/bin/env node
/**
 * Find Unused Storage Files
 * 
 * This script compares files in Supabase storage with URLs referenced in the database
 * to identify orphaned files that can be safely deleted.
 * 
 * Usage: node scripts/find-unused-files.js
 */

const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Extract file path from Supabase storage URL
 * Handles both full URLs and relative paths
 */
function extractFilePath(url) {
  if (!url) return null;
  
  // Remove query parameters
  const cleanUrl = url.split('?')[0];
  
  // Extract path from full Supabase URL
  // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
  const storageMatch = cleanUrl.match(/\/storage\/v1\/object\/public\/[^\/]+\/(.+)$/);
  if (storageMatch) {
    return storageMatch[1];
  }
  
  // If it's already a relative path (just the filename)
  if (!cleanUrl.startsWith('http')) {
    return cleanUrl;
  }
  
  return null;
}

/**
 * Extract URLs from JSONB fields (arrays of objects with url properties)
 */
function extractUrlsFromJsonb(jsonbData) {
  if (!jsonbData) return [];
  
  try {
    const data = typeof jsonbData === 'string' ? JSON.parse(jsonbData) : jsonbData;
    
    if (Array.isArray(data)) {
      return data
        .map(item => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item !== null) {
            return item.url || item.src || item.image || null;
          }
          return null;
        })
        .filter(Boolean);
    }
    
    if (typeof data === 'object' && data !== null) {
      return [data.url || data.src || data.image].filter(Boolean);
    }
    
    return [];
  } catch (e) {
    return [];
  }
}

/**
 * Get all referenced URLs from database
 */
async function getAllReferencedUrls() {
  const referencedFiles = new Set();
  
  try {
    console.log('🔍 Querying database for referenced URLs...\n');
    
    // 1. Profiles - avatar_url
    const { data: profiles } = await supabase.from('profiles').select('avatar_url');
    profiles?.forEach(p => {
      if (p.avatar_url) {
        const filePath = extractFilePath(p.avatar_url);
        if (filePath) referencedFiles.add(filePath);
      }
    });
    console.log(`   ✓ Profiles: ${profiles?.length || 0} records`);
    
    // 2. Projects - url, case_study_images, flow_diagram_images, video_items
    const { data: projects } = await supabase.from('projects').select('url, case_study_images, flow_diagram_images, video_items');
    let projectUrls = 0;
    projects?.forEach(p => {
      if (p.url) {
        const filePath = extractFilePath(p.url);
        if (filePath) {
          referencedFiles.add(filePath);
          projectUrls++;
        }
      }
      
      // Extract from JSONB arrays
      const caseStudyUrls = extractUrlsFromJsonb(p.case_study_images);
      caseStudyUrls.forEach(url => {
        const filePath = extractFilePath(url);
        if (filePath) referencedFiles.add(filePath);
      });
      
      const flowDiagramUrls = extractUrlsFromJsonb(p.flow_diagram_images);
      flowDiagramUrls.forEach(url => {
        const filePath = extractFilePath(url);
        if (filePath) referencedFiles.add(filePath);
      });
      
      const videoUrls = extractUrlsFromJsonb(p.video_items);
      videoUrls.forEach(url => {
        const filePath = extractFilePath(url);
        if (filePath) referencedFiles.add(filePath);
      });
    });
    console.log(`   ✓ Projects: ${projects?.length || 0} records, ${projectUrls} main images`);
    
    // 3. Visuals Gallery
    const { data: visuals } = await supabase.from('visuals_gallery').select('url');
    visuals?.forEach(v => {
      if (v.url) {
        const filePath = extractFilePath(v.url);
        if (filePath) referencedFiles.add(filePath);
      }
    });
    console.log(`   ✓ Visuals Gallery: ${visuals?.length || 0} records`);
    
    // 4. SEO Data - og_image, twitter_image, default_og_image, favicon_image
    const { data: seoData } = await supabase.from('seo_data').select('og_image, twitter_image, default_og_image, favicon_image');
    seoData?.forEach(s => {
      [s.og_image, s.twitter_image, s.default_og_image, s.favicon_image].forEach(url => {
        if (url) {
          const filePath = extractFilePath(url);
          if (filePath) referencedFiles.add(filePath);
        }
      });
    });
    console.log(`   ✓ SEO Data: ${seoData?.length || 0} records`);
    
    // 5. App Settings - logo_url
    const { data: appSettings } = await supabase.from('app_settings').select('logo_url');
    appSettings?.forEach(s => {
      if (s.logo_url) {
        const filePath = extractFilePath(s.logo_url);
        if (filePath) referencedFiles.add(filePath);
      }
    });
    console.log(`   ✓ App Settings: ${appSettings?.length || 0} records`);
    
    // 6. Music Tracks - url (audio), image (album art)
    const { data: musicTracks } = await supabase.from('music_tracks').select('url, image');
    musicTracks?.forEach(t => {
      if (t.url) {
        const filePath = extractFilePath(t.url);
        if (filePath) referencedFiles.add(filePath);
      }
      if (t.image) {
        const filePath = extractFilePath(t.image);
        if (filePath) referencedFiles.add(filePath);
      }
    });
    console.log(`   ✓ Music Tracks: ${musicTracks?.length || 0} records`);
    
    // 7. Music Playlist - url
    const { data: musicPlaylist } = await supabase.from('music_playlist').select('url');
    musicPlaylist?.forEach(p => {
      if (p.url) {
        const filePath = extractFilePath(p.url);
        if (filePath) referencedFiles.add(filePath);
      }
    });
    console.log(`   ✓ Music Playlist: ${musicPlaylist?.length || 0} records`);
    
    console.log(`\n   📊 Total unique referenced files: ${referencedFiles.size}\n`);
    
    return referencedFiles;
  } catch (error) {
    console.error('❌ Error querying database:', error.message);
    return new Set();
  }
}

/**
 * List all files in a storage bucket
 */
async function listStorageFiles(bucketName) {
  try {
    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list('', {
        limit: 10000,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (error) {
      console.error(`❌ Error listing files in ${bucketName}:`, error.message);
      return [];
    }
    
    return files || [];
  } catch (error) {
    console.error(`❌ Error accessing bucket ${bucketName}:`, error.message);
    return [];
  }
}

async function main() {
  console.log('🔍 Finding Unused Storage Files');
  console.log('═'.repeat(60));
  
  // Get all referenced URLs from database
  const referencedFiles = await getAllReferencedUrls();
  
  // Check each storage bucket
  const buckets = ['portfolio-images', 'images', 'audio'];
  const allUnusedFiles = [];
  let totalUnusedSize = 0;
  
  for (const bucket of buckets) {
    console.log(`\n📦 Checking bucket: ${bucket}`);
    console.log('─'.repeat(60));
    
    const files = await listStorageFiles(bucket);
    
    if (files.length === 0) {
      console.log('   No files found in this bucket.');
      continue;
    }
    
    console.log(`   Total files in bucket: ${files.length}`);
    
    const unused = [];
    let unusedSize = 0;
    
    for (const file of files) {
      const filePath = file.name;
      const isReferenced = referencedFiles.has(filePath);
      
      if (!isReferenced) {
        const size = file.metadata?.size || 0;
        unused.push({
          bucket,
          name: filePath,
          size,
          created: file.created_at
        });
        unusedSize += size;
        totalUnusedSize += size;
      }
    }
    
    if (unused.length > 0) {
      console.log(`\n   ⚠️  Found ${unused.length} unused files (${formatBytes(unusedSize)})`);
      console.log(`\n   📋 Unused files:`);
      
      // Sort by size (largest first)
      unused.sort((a, b) => b.size - a.size);
      
      unused.forEach((file, index) => {
        console.log(`      ${index + 1}. ${file.name}`);
        console.log(`         Size: ${formatBytes(file.size)} | Created: ${file.created || 'Unknown'}`);
      });
      
      allUnusedFiles.push(...unused);
    } else {
      console.log(`\n   ✅ All files are referenced in the database.`);
    }
  }
  
  // Summary
  console.log('\n\n📊 SUMMARY');
  console.log('═'.repeat(60));
  
  if (allUnusedFiles.length > 0) {
    console.log(`   ⚠️  Total unused files: ${allUnusedFiles.length}`);
    console.log(`   💾 Total unused storage: ${formatBytes(totalUnusedSize)}`);
    console.log(`   📈 Average unused file size: ${formatBytes(totalUnusedSize / allUnusedFiles.length)}`);
    
    // Group by bucket
    const byBucket = {};
    allUnusedFiles.forEach(file => {
      if (!byBucket[file.bucket]) {
        byBucket[file.bucket] = { count: 0, size: 0 };
      }
      byBucket[file.bucket].count++;
      byBucket[file.bucket].size += file.size;
    });
    
    console.log(`\n   📦 Unused files by bucket:`);
    Object.entries(byBucket).forEach(([bucket, stats]) => {
      console.log(`      ${bucket}: ${stats.count} files (${formatBytes(stats.size)})`);
    });
    
    console.log(`\n   💡 You can safely delete these files to free up ${formatBytes(totalUnusedSize)} of storage.`);
    console.log(`   ⚠️  Note: Review the list above before deleting to ensure they're not needed.`);
  } else {
    console.log(`   ✅ No unused files found! All storage files are referenced in the database.`);
  }
  
  console.log('\n✅ Analysis complete!\n');
}

main().catch(console.error);

