/**
 * Comprehensive diagnostic utilities for debugging localStorage and import issues
 */

// Defensive check - only run if window exists
if (typeof window === 'undefined') {
  console.warn('Diagnostics skipped - no window object');
}

export function runFullDiagnostics() {
  // Extra safety check
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    console.error('Cannot run diagnostics - environment not ready');
    return { accessible: false, error: 'No window or localStorage' };
  }
  console.log('🔬 ========== FULL DIAGNOSTICS ==========');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('🌐 URL:', window.location.href);
  console.log('👤 User Agent:', navigator.userAgent);
  
  // 1. Check localStorage accessibility
  console.log('\n📦 localStorage Check:');
  try {
    localStorage.setItem('__diagnostic_test', 'test');
    const test = localStorage.getItem('__diagnostic_test');
    localStorage.removeItem('__diagnostic_test');
    console.log('✅ localStorage is accessible');
  } catch (e) {
    console.error('❌ localStorage is NOT accessible:', e);
    return { accessible: false, error: e };
  }
  
  // 2. List all keys
  console.log('\n🔑 All localStorage keys:', Object.keys(localStorage));
  
  // 3. Check each data item
  console.log('\n📊 Data validation:');
  
  const results: any = {
    accessible: true,
    keys: Object.keys(localStorage),
    validation: {}
  };
  
  // Check authentication
  const auth = localStorage.getItem('isAuthenticated');
  results.validation.isAuthenticated = {
    exists: !!auth,
    value: auth,
    valid: auth === 'true' || auth === 'false' || auth === null
  };
  console.log('🔐 isAuthenticated:', results.validation.isAuthenticated);
  
  // Check case studies
  const caseStudiesRaw = localStorage.getItem('caseStudies');
  results.validation.caseStudies = {
    exists: !!caseStudiesRaw,
    size: caseStudiesRaw?.length || 0,
    valid: false,
    count: 0,
    error: null
  };
  
  if (caseStudiesRaw) {
    try {
      const parsed = JSON.parse(caseStudiesRaw);
      results.validation.caseStudies.valid = Array.isArray(parsed);
      results.validation.caseStudies.count = Array.isArray(parsed) ? parsed.length : 0;
      console.log(`✅ caseStudies: ${parsed.length} items, ${(caseStudiesRaw.length / 1024).toFixed(2)} KB`);
      
      // Check first item structure
      if (parsed[0]) {
        console.log('📋 First case study structure:', {
          id: parsed[0].id,
          title: parsed[0].title,
          hasUrl: !!parsed[0].url,
          hasContent: !!parsed[0].caseStudyContent,
          imageCount: parsed[0].caseStudyImages?.length || 0
        });
      }
    } catch (e) {
      results.validation.caseStudies.error = (e as Error).message;
      console.error('❌ caseStudies JSON invalid:', e);
      console.error('First 200 chars:', caseStudiesRaw.substring(0, 200));
    }
  } else {
    console.log('ℹ️ caseStudies: not found');
  }
  
  // Check design projects
  const designProjectsRaw = localStorage.getItem('designProjects');
  results.validation.designProjects = {
    exists: !!designProjectsRaw,
    size: designProjectsRaw?.length || 0,
    valid: false,
    count: 0,
    error: null
  };
  
  if (designProjectsRaw) {
    try {
      const parsed = JSON.parse(designProjectsRaw);
      results.validation.designProjects.valid = Array.isArray(parsed);
      results.validation.designProjects.count = Array.isArray(parsed) ? parsed.length : 0;
      console.log(`✅ designProjects: ${parsed.length} items, ${(designProjectsRaw.length / 1024).toFixed(2)} KB`);
    } catch (e) {
      results.validation.designProjects.error = (e as Error).message;
      console.error('❌ designProjects JSON invalid:', e);
    }
  } else {
    console.log('ℹ️ designProjects: not found');
  }
  
  // Check hero text
  const heroTextRaw = localStorage.getItem('heroText');
  results.validation.heroText = {
    exists: !!heroTextRaw,
    size: heroTextRaw?.length || 0,
    valid: false,
    error: null
  };
  
  if (heroTextRaw) {
    try {
      const parsed = JSON.parse(heroTextRaw);
      results.validation.heroText.valid = typeof parsed === 'object' && parsed !== null;
      console.log('✅ heroText:', (heroTextRaw.length / 1024).toFixed(2), 'KB');
    } catch (e) {
      results.validation.heroText.error = (e as Error).message;
      console.error('❌ heroText JSON invalid:', e);
    }
  } else {
    console.log('ℹ️ heroText: not found');
  }
  
  // Calculate total size
  let totalSize = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalSize += (localStorage[key].length + key.length) * 2; // UTF-16
    }
  }
  
  results.totalSize = totalSize;
  results.totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
  
  console.log('\n💾 Total storage used:', results.totalSizeMB, 'MB');
  
  // Check for corruption
  const issues = [];
  if (!results.validation.caseStudies.valid && results.validation.caseStudies.exists) {
    issues.push('caseStudies is corrupted');
  }
  if (!results.validation.designProjects.valid && results.validation.designProjects.exists) {
    issues.push('designProjects is corrupted');
  }
  if (!results.validation.heroText.valid && results.validation.heroText.exists) {
    issues.push('heroText is corrupted');
  }
  
  results.issues = issues;
  
  if (issues.length > 0) {
    console.error('\n❌ ISSUES FOUND:', issues);
  } else {
    console.log('\n✅ No corruption detected');
  }
  
  console.log('🔬 ========== END DIAGNOSTICS ==========\n');
  
  return results;
}

export function autoRepairCorruption() {
  console.log('🔧 AUTO-REPAIR: Starting...');
  
  const repairs = [];
  
  // Repair case studies
  const cs = localStorage.getItem('caseStudies');
  if (cs) {
    try {
      const parsed = JSON.parse(cs);
      if (!Array.isArray(parsed)) {
        localStorage.removeItem('caseStudies');
        repairs.push('Removed corrupted caseStudies');
        console.log('🔧 Removed corrupted caseStudies');
      }
    } catch (e) {
      localStorage.removeItem('caseStudies');
      repairs.push('Removed invalid caseStudies JSON');
      console.log('🔧 Removed invalid caseStudies JSON');
    }
  }
  
  // Repair design projects
  const dp = localStorage.getItem('designProjects');
  if (dp) {
    try {
      const parsed = JSON.parse(dp);
      if (!Array.isArray(parsed)) {
        localStorage.removeItem('designProjects');
        repairs.push('Removed corrupted designProjects');
        console.log('🔧 Removed corrupted designProjects');
      }
    } catch (e) {
      localStorage.removeItem('designProjects');
      repairs.push('Removed invalid designProjects JSON');
      console.log('🔧 Removed invalid designProjects JSON');
    }
  }
  
  // Repair hero text
  const ht = localStorage.getItem('heroText');
  if (ht) {
    try {
      const parsed = JSON.parse(ht);
      if (typeof parsed !== 'object' || parsed === null) {
        localStorage.removeItem('heroText');
        repairs.push('Removed corrupted heroText');
        console.log('🔧 Removed corrupted heroText');
      }
    } catch (e) {
      localStorage.removeItem('heroText');
      repairs.push('Removed invalid heroText JSON');
      console.log('🔧 Removed invalid heroText JSON');
    }
  }
  
  if (repairs.length > 0) {
    console.log('🔧 AUTO-REPAIR: Completed', repairs.length, 'repairs');
    return repairs;
  } else {
    console.log('🔧 AUTO-REPAIR: No repairs needed');
    return [];
  }
}

// Make diagnostics available in browser console
if (typeof window !== 'undefined') {
  (window as any).runDiagnostics = runFullDiagnostics;
  (window as any).autoRepair = autoRepairCorruption;
  console.log('🛠️ Diagnostic tools available:');
  console.log('  - window.runDiagnostics() - Full diagnostic report');
  console.log('  - window.autoRepair() - Auto-repair corrupted data');
}
