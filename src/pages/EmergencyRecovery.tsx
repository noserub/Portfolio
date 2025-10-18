import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

export function EmergencyRecovery() {
  const [storageInfo, setStorageInfo] = useState<{
    accessible: boolean;
    caseStudies: { exists: boolean; count: number; valid: boolean; error?: string };
    designProjects: { exists: boolean; count: number; valid: boolean; error?: string };
    sizeMB: string;
    overLimit: boolean;
  } | null>(null);

  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    checkStorage();
  }, []);

  const checkStorage = () => {
    try {
      // Test access
      localStorage.setItem('__test', 'test');
      localStorage.removeItem('__test');

      // Check case studies
      const csRaw = localStorage.getItem('caseStudies');
      let csInfo = { exists: !!csRaw, count: 0, valid: false, error: undefined as string | undefined };
      
      if (csRaw) {
        try {
          const parsed = JSON.parse(csRaw);
          csInfo.valid = Array.isArray(parsed);
          csInfo.count = Array.isArray(parsed) ? parsed.length : 0;
        } catch (e) {
          csInfo.error = (e as Error).message;
        }
      }

      // Check design projects
      const dpRaw = localStorage.getItem('designProjects');
      let dpInfo = { exists: !!dpRaw, count: 0, valid: false, error: undefined as string | undefined };
      
      if (dpRaw) {
        try {
          const parsed = JSON.parse(dpRaw);
          dpInfo.valid = Array.isArray(parsed);
          dpInfo.count = Array.isArray(parsed) ? parsed.length : 0;
        } catch (e) {
          dpInfo.error = (e as Error).message;
        }
      }

      // Calculate size
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += (localStorage[key].length + key.length) * 2;
        }
      }
      
      const sizeMB = (total / 1024 / 1024).toFixed(2);
      const overLimit = total > 4 * 1024 * 1024; // Over 4MB warning

      setStorageInfo({
        accessible: true,
        caseStudies: csInfo,
        designProjects: dpInfo,
        sizeMB,
        overLimit
      });
    } catch (e) {
      setStorageInfo({
        accessible: false,
        caseStudies: { exists: false, count: 0, valid: false },
        designProjects: { exists: false, count: 0, valid: false },
        sizeMB: '0',
        overLimit: false
      });
    }
  };

  const handleAutoFix = () => {
    let fixed = 0;

    // Fix case studies
    const cs = localStorage.getItem('caseStudies');
    if (cs) {
      try {
        const parsed = JSON.parse(cs);
        if (!Array.isArray(parsed)) {
          localStorage.removeItem('caseStudies');
          fixed++;
        }
      } catch (e) {
        localStorage.removeItem('caseStudies');
        fixed++;
      }
    }

    // Fix design projects
    const dp = localStorage.getItem('designProjects');
    if (dp) {
      try {
        const parsed = JSON.parse(dp);
        if (!Array.isArray(parsed)) {
          localStorage.removeItem('designProjects');
          fixed++;
        }
      } catch (e) {
        localStorage.removeItem('designProjects');
        fixed++;
      }
    }

    // Clear fresh import flag
    localStorage.removeItem('freshImport');

    setMessage({ type: 'success', text: `Fixed ${fixed} issues. Refresh the page to continue.` });
    checkStorage();
  };

  const handleClearAll = () => {
    if (confirm('⚠️ This will clear ALL data and reset to defaults.\n\nAre you absolutely sure?')) {
      const auth = localStorage.getItem('isAuthenticated');
      const theme = localStorage.getItem('theme');
      
      localStorage.clear();
      
      if (auth) localStorage.setItem('isAuthenticated', auth);
      if (theme) localStorage.setItem('theme', theme);
      
      setMessage({ type: 'success', text: 'Data cleared! Redirecting to home...' });
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleClearImportFlag = () => {
    localStorage.removeItem('freshImport');
    setMessage({ type: 'success', text: 'Import flag cleared! Redirecting...' });
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  if (!storageInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-orange-500/10 rounded-full">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">🔧 Emergency Recovery</h1>
              <p className="text-muted-foreground">Fix blank screen and storage issues</p>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg border mb-4 ${
              message.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-300' :
              message.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-300' :
              'bg-blue-500/10 border-blue-500/50 text-blue-700 dark:text-blue-300'
            }`}>
              {message.text}
            </div>
          )}

          {/* Storage Status */}
          <div className="bg-muted rounded-lg p-6 mb-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              📊 Storage Status
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">localStorage:</span>
                <span className="font-medium flex items-center gap-2">
                  {storageInfo.accessible ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 dark:text-green-400">Accessible</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-600 dark:text-red-400">Not Accessible</span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Case Studies:</span>
                <span className="font-medium flex items-center gap-2">
                  {storageInfo.caseStudies.valid ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 dark:text-green-400">
                        {storageInfo.caseStudies.count} items
                      </span>
                    </>
                  ) : storageInfo.caseStudies.exists ? (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-600 dark:text-red-400">Corrupted</span>
                    </>
                  ) : (
                    <>
                      <Info className="w-4 h-4 text-gray-500" />
                      <span className="text-muted-foreground">None</span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Design Projects:</span>
                <span className="font-medium flex items-center gap-2">
                  {storageInfo.designProjects.valid ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 dark:text-green-400">
                        {storageInfo.designProjects.count} items
                      </span>
                    </>
                  ) : storageInfo.designProjects.exists ? (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-600 dark:text-red-400">Corrupted</span>
                    </>
                  ) : (
                    <>
                      <Info className="w-4 h-4 text-gray-500" />
                      <span className="text-muted-foreground">None</span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-border">
                <span className="text-sm text-muted-foreground">Storage Used:</span>
                <span className={`font-bold ${storageInfo.overLimit ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                  {storageInfo.sizeMB} MB
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Browser Limit:</span>
                <span className="font-medium text-muted-foreground">~5-10 MB</span>
              </div>
            </div>

            {storageInfo.overLimit && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                  ⚠️ Storage Almost Full! Consider clearing old data or reducing image sizes.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleGoHome}
              variant="default"
              className="w-full"
              size="lg"
            >
              🏠 Go to App
            </Button>

            <Button
              onClick={handleAutoFix}
              variant="secondary"
              className="w-full"
              size="lg"
            >
              🔧 Auto-Fix Corruption
            </Button>

            <Button
              onClick={handleClearImportFlag}
              variant="secondary"
              className="w-full"
              size="lg"
            >
              🔄 Clear Import Flag & Go Home
            </Button>

            <Button
              onClick={handleClearAll}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              ⚠️ Clear All Data
            </Button>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold mb-3">💡 Quick Help</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Blank screen after import?</strong> Click "Clear Import Flag & Go Home"</p>
            <p><strong>Storage quota exceeded?</strong> Click "Clear All Data" then use smaller images (Unsplash URLs instead of uploads)</p>
            <p><strong>Corrupted data?</strong> Click "Auto-Fix Corruption"</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmergencyRecovery;
