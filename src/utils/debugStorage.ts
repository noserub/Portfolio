/**
 * Debug utilities for localStorage
 */

import { importAllData } from './importHelper';

export function logStorageStatus() {
  console.group('📦 localStorage Debug Info');
  
  // Get all keys
  const keys = Object.keys(localStorage);
  console.log('Total keys:', keys.length);
  
  // Calculate sizes
  let total = 0;
  keys.forEach(key => {
    const value = localStorage.getItem(key) || '';
    const size = (value.length + key.length) * 2; // UTF-16 = 2 bytes per char
    total += size;
    
    console.log(`  ${key}:`, {
      size: `${(size / 1024).toFixed(2)} KB`,
      preview: value.substring(0, 100) + (value.length > 100 ? '...' : '')
    });
  });
  
  console.log('Total storage used:', `${(total / 1024 / 1024).toFixed(2)} MB`);
  console.log('Estimated quota:', '5-10 MB (browser dependent)');
  
  console.groupEnd();
}

export function exportAllData() {
  console.log('📤 Exporting all data...');
  
  const data: Record<string, any> = {};
  
  // Export from localStorage
  Object.keys(localStorage).forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          // Try to parse as JSON
          data[key] = JSON.parse(value);
        } catch {
          // If not JSON, store as string
          data[key] = value;
        }
      }
    } catch (error) {
      console.error(`Error exporting ${key}:`, error);
    }
  });
  
  // Create a formatted JSON file
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('✅ Export complete!');
  
  return data;
}

export async function importData() {
  console.log('📥 Select a JSON file to import...');
  
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) {
      console.log('❌ No file selected');
      return;
    }
    
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      
      console.log('📋 File loaded successfully');
      console.log('📊 Data preview:', {
        caseStudies: jsonData.caseStudies?.length || 0,
        designProjects: jsonData.designProjects?.length || 0,
        keys: Object.keys(jsonData)
      });
      
      const overwrite = confirm(
        '🔄 Do you want to OVERWRITE existing projects with the same name?\n\n' +
        'YES = Update existing projects with imported data\n' +
        'NO = Skip projects that already exist (only add new ones)'
      );
      
      console.log('🚀 Starting import...');
      
      const results = await importAllData(jsonData, {
        overwriteExisting: overwrite,
        onProgress: (msg) => console.log(msg)
      });
      
      console.log('\n✅ Import complete!');
      console.log('🔄 Refreshing page in 2 seconds...');
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      alert('Import failed. Check console for details.');
    }
  };
  
  input.click();
}

export function clearAllData() {
  if (confirm('⚠️ This will delete ALL saved data. Are you sure?')) {
    localStorage.clear();
    console.log('✅ All localStorage data cleared');
    window.location.reload();
  }
}

// Make these available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugStorage = {
    log: logStorageStatus,
    export: exportAllData,
    import: importData,
    clear: clearAllData
  };
  
  console.log('💡 Debug commands available:');
  console.log('  - debugStorage.log() - View storage status');
  console.log('  - debugStorage.export() - Export all data');
  console.log('  - debugStorage.import() - Import data from JSON file');
  console.log('  - debugStorage.clear() - Clear all data');
}
