/**
 * Debug utilities for localStorage
 */

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
  const data: Record<string, string | null> = {};
  Object.keys(localStorage).forEach(key => {
    data[key] = localStorage.getItem(key);
  });
  return data;
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
    clear: clearAllData
  };
  
  console.log('💡 Debug commands available:');
  console.log('  - debugStorage.log() - View storage status');
  console.log('  - debugStorage.export() - Export all data');
  console.log('  - debugStorage.clear() - Clear all data');
}
