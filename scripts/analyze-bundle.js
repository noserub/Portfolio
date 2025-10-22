#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing bundle size and performance...\n');

// Check if we're in a Vite project
const isVite = fs.existsSync('vite.config.ts') || fs.existsSync('vite.config.js');

if (isVite) {
  console.log('📦 Vite project detected - running bundle analysis...\n');
  
  try {
    // Run Vite bundle analyzer
    execSync('npx vite-bundle-analyzer', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  vite-bundle-analyzer not found, installing...');
    try {
      execSync('npm install --save-dev vite-bundle-analyzer', { stdio: 'inherit' });
      execSync('npx vite-bundle-analyzer', { stdio: 'inherit' });
    } catch (installError) {
      console.log('❌ Failed to install vite-bundle-analyzer');
      console.log('💡 Manual analysis: Run "npm run build" and check the dist folder size');
    }
  }
} else {
  console.log('📦 Non-Vite project - manual analysis required');
  console.log('💡 Run "npm run build" and check the build output folder');
}

// Performance recommendations
console.log('\n🚀 Performance Optimization Recommendations:');
console.log('1. Use React.memo() for components that receive stable props');
console.log('2. Implement lazy loading for images and routes');
console.log('3. Use useMemo() and useCallback() for expensive calculations');
console.log('4. Consider code splitting for large components');
console.log('5. Optimize bundle size by removing unused dependencies');
console.log('6. Use virtual scrolling for large lists');
console.log('7. Implement skeleton loading states');
console.log('8. Consider using a CDN for static assets');
