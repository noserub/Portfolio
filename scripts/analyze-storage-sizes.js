#!/usr/bin/env node
/**
 * Analyze Supabase Storage File Sizes
 * 
 * This script queries your Supabase storage buckets and displays
 * statistics about file sizes to help you configure bucket limits.
 * 
 * Usage: node scripts/analyze-storage-sizes.js
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

function calculateStats(files) {
  if (files.length === 0) {
    return {
      count: 0,
      totalSize: 0,
      avgSize: 0,
      minSize: 0,
      maxSize: 0,
      medianSize: 0
    };
  }

  const sizes = files
    .map(f => {
      // Try different metadata formats
      const size = f.metadata?.size || 
                   f.metadata?.fileSize || 
                   (f.metadata && typeof f.metadata === 'object' ? Object.values(f.metadata)[0] : 0) ||
                   0;
      return parseInt(size) || 0;
    })
    .filter(size => size > 0)
    .sort((a, b) => a - b);

  if (sizes.length === 0) {
    return {
      count: files.length,
      totalSize: 0,
      avgSize: 0,
      minSize: 0,
      maxSize: 0,
      medianSize: 0
    };
  }

  const totalSize = sizes.reduce((a, b) => a + b, 0);
  const avgSize = totalSize / sizes.length;
  const minSize = sizes[0];
  const maxSize = sizes[sizes.length - 1];
  const medianSize = sizes[Math.floor(sizes.length / 2)];

  return {
    count: sizes.length,
    totalSize,
    avgSize,
    minSize,
    maxSize,
    medianSize
  };
}

async function analyzeBucket(bucketName) {
  console.log(`\n📦 Analyzing bucket: ${bucketName}`);
  console.log('─'.repeat(50));

  try {
    // List all files in the bucket
    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list('', {
        limit: 10000,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error(`❌ Error listing files: ${error.message}`);
      return null;
    }

    if (!files || files.length === 0) {
      console.log('   No files found in this bucket.');
      return null;
    }

    const stats = calculateStats(files);

    console.log(`   📊 Total files: ${stats.count}`);
    console.log(`   💾 Total size: ${formatBytes(stats.totalSize)}`);
    console.log(`   📈 Average size: ${formatBytes(stats.avgSize)}`);
    console.log(`   📉 Minimum size: ${formatBytes(stats.minSize)}`);
    console.log(`   📊 Maximum size: ${formatBytes(stats.maxSize)}`);
    console.log(`   📊 Median size: ${formatBytes(stats.medianSize)}`);

    // Show size distribution
    if (stats.count > 0) {
      const small = files.filter(f => {
        const size = f.metadata?.size || 0;
        return size > 0 && size < 100 * 1024; // < 100KB
      }).length;
      const medium = files.filter(f => {
        const size = f.metadata?.size || 0;
        return size >= 100 * 1024 && size < 1024 * 1024; // 100KB - 1MB
      }).length;
      const large = files.filter(f => {
        const size = f.metadata?.size || 0;
        return size >= 1024 * 1024 && size < 5 * 1024 * 1024; // 1MB - 5MB
      }).length;
      const xlarge = files.filter(f => {
        const size = f.metadata?.size || 0;
        return size >= 5 * 1024 * 1024; // >= 5MB
      }).length;

      console.log(`\n   📊 Size Distribution:`);
      console.log(`      Small (< 100KB): ${small} files`);
      console.log(`      Medium (100KB - 1MB): ${medium} files`);
      console.log(`      Large (1MB - 5MB): ${large} files`);
      console.log(`      X-Large (>= 5MB): ${xlarge} files`);
    }

    // Show sample files
    if (files.length > 0) {
      console.log(`\n   📋 Sample files (first 5):`);
      files.slice(0, 5).forEach((file, index) => {
        const size = file.metadata?.size || 0;
        console.log(`      ${index + 1}. ${file.name} - ${formatBytes(size)}`);
      });
    }

    return stats;
  } catch (err) {
    console.error(`❌ Error analyzing bucket ${bucketName}:`, err.message);
    return null;
  }
}

async function main() {
  console.log('🔍 Supabase Storage Size Analyzer');
  console.log('═'.repeat(50));

  const buckets = ['portfolio-images', 'images', 'audio'];
  const allStats = [];

  for (const bucket of buckets) {
    const stats = await analyzeBucket(bucket);
    if (stats) {
      allStats.push({ bucket, ...stats });
    }
  }

  // Summary
  if (allStats.length > 0) {
    console.log('\n\n📊 SUMMARY');
    console.log('═'.repeat(50));
    
    const totalFiles = allStats.reduce((sum, s) => sum + s.count, 0);
    const totalSize = allStats.reduce((sum, s) => sum + s.totalSize, 0);
    const overallAvg = totalFiles > 0 ? totalSize / totalFiles : 0;

    console.log(`   Total files across all buckets: ${totalFiles}`);
    console.log(`   Total storage used: ${formatBytes(totalSize)}`);
    console.log(`   Overall average file size: ${formatBytes(overallAvg)}`);

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('─'.repeat(50));
    
    allStats.forEach(({ bucket, avgSize, maxSize, totalSize }) => {
      if (bucket === 'audio') {
        const recommended = Math.max(avgSize * 1.5, maxSize * 1.1);
        console.log(`   ${bucket}:`);
        console.log(`      Recommended per-file limit: ${formatBytes(recommended)}`);
        console.log(`      (Based on avg: ${formatBytes(avgSize)}, max: ${formatBytes(maxSize)})`);
      } else if (bucket === 'images' || bucket === 'portfolio-images') {
        const recommended = Math.max(avgSize * 2, maxSize * 1.1);
        console.log(`   ${bucket}:`);
        console.log(`      Recommended per-file limit: ${formatBytes(recommended)}`);
        console.log(`      (Based on avg: ${formatBytes(avgSize)}, max: ${formatBytes(maxSize)})`);
      }
    });

    // For 50MB total limit
    const remaining = 50 * 1024 * 1024 - totalSize;
    console.log(`\n   ⚠️  With 50MB total limit:`);
    console.log(`      Currently used: ${formatBytes(totalSize)}`);
    console.log(`      Remaining: ${formatBytes(remaining)}`);
    console.log(`      Usage: ${((totalSize / (50 * 1024 * 1024)) * 100).toFixed(1)}%`);
  }

  console.log('\n✅ Analysis complete!\n');
}

main().catch(console.error);
