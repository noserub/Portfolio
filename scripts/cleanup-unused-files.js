#!/usr/bin/env node
/**
 * Cleanup Unused Storage Files
 * 
 * This script deletes files from Supabase storage that are not referenced in the database.
 * 
 * Usage: 
 *   Dry run (preview only): node scripts/cleanup-unused-files.js --dry-run
 *   Actually delete:        node scripts/cleanup-unused-files.js --confirm
 */

const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');
const path = require('path');
const readline = require('readline');

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('-d');
const isConfirmed = args.includes('--confirm') || args.includes('-c');

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Extract file path from Supabase storage URL
 */
function extractFilePath(url) {
  if (!url) return null;
  const cleanUrl = url.split('?')[0];
  const storageMatch = cleanUrl.match(/\/storage\/v1\/object\/public\/[^\/]+\/(.+)$/);
  if (storageMatch) return storageMatch[1];
  if (!cleanUrl.startsWith('http')) return cleanUrl;
  return null;
}

/**
 * Extract URLs from JSONB fields
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
    // Profiles
    const { data: profiles } = await supabase.from('profiles').select('avatar_url');
    profiles?.forEach(p => {
      if (p.avatar_url) {
        const filePath = extractFilePath(p.avatar_url);
        if (filePath) referencedFiles.add(filePath);
      }
    });
    
    // Projects
    const { data: projects } = await supabase.from('projects').select('url, case_study_images, flow_diagram_images, video_items');
    projects?.forEach(p => {
      if (p.url) {
        const filePath = extractFilePath(p.url);
        if (filePath) referencedFiles.add(filePath);
      }
      extractUrlsFromJsonb(p.case_study_images).forEach(url => {
        const filePath = extractFilePath(url);
        if (filePath) referencedFiles.add(filePath);
      });
      extractUrlsFromJsonb(p.flow_diagram_images).forEach(url => {
        const filePath = extractFilePath(url);
        if (filePath) referencedFiles.add(filePath);
      });
      extractUrlsFromJsonb(p.video_items).forEach(url => {
        const filePath = extractFilePath(url);
        if (filePath) referencedFiles.add(filePath);
      });
    });
    
    // Visuals Gallery
    const { data: visuals } = await supabase.from('visuals_gallery').select('url');
    visuals?.forEach(v => {
      if (v.url) {
        const filePath = extractFilePath(v.url);
        if (filePath) referencedFiles.add(filePath);
      }
    });
    
    // SEO Data
    const { data: seoData } = await supabase.from('seo_data').select('og_image, twitter_image, default_og_image, favicon_image');
    seoData?.forEach(s => {
      [s.og_image, s.twitter_image, s.default_og_image, s.favicon_image].forEach(url => {
        if (url) {
          const filePath = extractFilePath(url);
          if (filePath) referencedFiles.add(filePath);
        }
      });
    });
    
    // App Settings
    const { data: appSettings } = await supabase.from('app_settings').select('logo_url');
    appSettings?.forEach(s => {
      if (s.logo_url) {
        const filePath = extractFilePath(s.logo_url);
        if (filePath) referencedFiles.add(filePath);
      }
    });
    
    // Music Tracks
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
    
    // Music Playlist
    const { data: musicPlaylist } = await supabase.from('music_playlist').select('url');
    musicPlaylist?.forEach(p => {
      if (p.url) {
        const filePath = extractFilePath(p.url);
        if (filePath) referencedFiles.add(filePath);
      }
    });
    
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

/**
 * Delete files from storage
 */
async function deleteFiles(bucketName, filePaths) {
  const results = {
    success: [],
    failed: []
  };
  
  // Delete in batches of 10 to avoid overwhelming the API
  const batchSize = 10;
  for (let i = 0; i < filePaths.length; i += batchSize) {
    const batch = filePaths.slice(i, i + batchSize);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove(batch);
    
    if (error) {
      console.error(`   ❌ Error deleting batch:`, error.message);
      results.failed.push(...batch);
    } else {
      results.success.push(...batch);
    }
    
    // Small delay between batches
    if (i + batchSize < filePaths.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

/**
 * Prompt for confirmation
 */
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function main() {
  console.log('🧹 Cleanup Unused Storage Files');
  console.log('═'.repeat(60));
  
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No files will be deleted\n');
  } else if (!isConfirmed) {
    console.log('⚠️  This will permanently delete files from storage!\n');
    console.log('   Use --dry-run to preview what will be deleted');
    console.log('   Use --confirm to actually delete files\n');
    process.exit(0);
  }
  
  // Get all referenced URLs from database
  console.log('🔍 Querying database for referenced URLs...');
  const referencedFiles = await getAllReferencedUrls();
  console.log(`   Found ${referencedFiles.size} referenced files\n`);
  
  // Check each storage bucket
  const buckets = ['portfolio-images', 'images', 'audio'];
  const allUnusedFiles = [];
  let totalUnusedSize = 0;
  
  for (const bucket of buckets) {
    const files = await listStorageFiles(bucket);
    
    if (files.length === 0) continue;
    
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
          size
        });
        unusedSize += size;
        totalUnusedSize += size;
      }
    }
    
    if (unused.length > 0) {
      allUnusedFiles.push(...unused);
    }
  }
  
  // Summary
  if (allUnusedFiles.length === 0) {
    console.log('✅ No unused files found! All storage files are referenced in the database.\n');
    return;
  }
  
  console.log('\n📊 FILES TO DELETE');
  console.log('═'.repeat(60));
  console.log(`   Total unused files: ${allUnusedFiles.length}`);
  console.log(`   Total storage to free: ${formatBytes(totalUnusedSize)}`);
  
  // Group by bucket
  const byBucket = {};
  allUnusedFiles.forEach(file => {
    if (!byBucket[file.bucket]) {
      byBucket[file.bucket] = { files: [], size: 0 };
    }
    byBucket[file.bucket].files.push(file.name);
    byBucket[file.bucket].size += file.size;
  });
  
  console.log(`\n   📦 Files by bucket:`);
  Object.entries(byBucket).forEach(([bucket, data]) => {
    console.log(`      ${bucket}: ${data.files.length} files (${formatBytes(data.size)})`);
  });
  
  // Show largest files
  const sorted = allUnusedFiles.sort((a, b) => b.size - a.size);
  console.log(`\n   📋 Top 10 largest files to delete:`);
  sorted.slice(0, 10).forEach((file, index) => {
    console.log(`      ${index + 1}. ${file.name} - ${formatBytes(file.size)}`);
  });
  
  if (isDryRun) {
    console.log('\n✅ Dry run complete. No files were deleted.');
    console.log('   Run with --confirm to actually delete these files.\n');
    return;
  }
  
  // Confirm deletion
  console.log('\n⚠️  WARNING: This will permanently delete the files listed above!');
  const confirmed = await askConfirmation('   Are you sure you want to proceed? (yes/no): ');
  
  if (!confirmed) {
    console.log('\n❌ Deletion cancelled.\n');
    return;
  }
  
  // Delete files
  console.log('\n🗑️  Deleting files...\n');
  
  let totalDeleted = 0;
  let totalFailed = 0;
  let totalFreed = 0;
  
  for (const [bucket, data] of Object.entries(byBucket)) {
    console.log(`📦 Deleting from ${bucket}...`);
    
    const results = await deleteFiles(bucket, data.files);
    
    totalDeleted += results.success.length;
    totalFailed += results.failed.length;
    totalFreed += data.size;
    
    console.log(`   ✅ Deleted: ${results.success.length} files`);
    if (results.failed.length > 0) {
      console.log(`   ❌ Failed: ${results.failed.length} files`);
      results.failed.forEach(file => {
        console.log(`      - ${file}`);
      });
    }
  }
  
  // Final summary
  console.log('\n\n📊 CLEANUP SUMMARY');
  console.log('═'.repeat(60));
  console.log(`   ✅ Successfully deleted: ${totalDeleted} files`);
  if (totalFailed > 0) {
    console.log(`   ❌ Failed to delete: ${totalFailed} files`);
  }
  console.log(`   💾 Storage freed: ${formatBytes(totalFreed)}`);
  console.log('\n✅ Cleanup complete!\n');
}

main().catch(console.error);

