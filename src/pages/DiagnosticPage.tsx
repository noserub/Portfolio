import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { runFullDiagnostics, autoRepairCorruption } from '../utils/diagnostics';

export function DiagnosticPage() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [repairs, setRepairs] = useState<string[]>([]);

  useEffect(() => {
    // Run diagnostics on mount
    const results = runFullDiagnostics();
    setDiagnostics(results);
  }, []);

  const handleRunDiagnostics = () => {
    const results = runFullDiagnostics();
    setDiagnostics(results);
  };

  const handleAutoRepair = () => {
    const repairResults = autoRepairCorruption();
    setRepairs(repairResults);
    
    // Re-run diagnostics after repair
    setTimeout(() => {
      const results = runFullDiagnostics();
      setDiagnostics(results);
    }, 100);
  };

  const handleClearAll = () => {
    if (confirm('⚠️ This will clear ALL data and reset to defaults.\n\nAre you absolutely sure?')) {
      const auth = localStorage.getItem('isAuthenticated');
      const theme = localStorage.getItem('theme');
      
      localStorage.clear();
      
      if (auth) localStorage.setItem('isAuthenticated', auth);
      if (theme) localStorage.setItem('theme', theme);
      
      alert('✅ Data cleared! Page will reload.');
      window.location.href = '/';
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg mb-6">
          <h1 className="text-3xl font-bold mb-2">🔬 Diagnostic Tool</h1>
          <p className="text-muted-foreground mb-6">
            Use this page to diagnose and fix localStorage issues
          </p>

          <div className="flex gap-3 flex-wrap mb-6">
            <Button onClick={handleRunDiagnostics} variant="default">
              🔄 Run Diagnostics
            </Button>
            <Button onClick={handleAutoRepair} variant="secondary">
              🔧 Auto-Repair
            </Button>
            <Button onClick={handleClearAll} variant="destructive">
              ⚠️ Clear All Data
            </Button>
            <Button onClick={handleGoHome} variant="outline">
              🏠 Go Home
            </Button>
          </div>

          {repairs.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-6">
              <h3 className="font-bold mb-2">✅ Repairs Completed:</h3>
              <ul className="list-disc list-inside text-sm">
                {repairs.map((repair, i) => (
                  <li key={i}>{repair}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {diagnostics && (
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">📊 Diagnostic Results</h2>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">localStorage Status</div>
                <div className="text-2xl font-bold">
                  {diagnostics.accessible ? '✅ Accessible' : '❌ Not Accessible'}
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Total Storage Used</div>
                <div className="text-2xl font-bold">{diagnostics.totalSizeMB} MB</div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Case Studies</div>
                <div className="text-2xl font-bold">
                  {diagnostics.validation.caseStudies.valid 
                    ? `✅ ${diagnostics.validation.caseStudies.count}` 
                    : diagnostics.validation.caseStudies.exists 
                      ? '❌ Corrupted' 
                      : 'ℹ️ None'}
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Design Projects</div>
                <div className="text-2xl font-bold">
                  {diagnostics.validation.designProjects.valid 
                    ? `✅ ${diagnostics.validation.designProjects.count}` 
                    : diagnostics.validation.designProjects.exists 
                      ? '❌ Corrupted' 
                      : 'ℹ️ None'}
                </div>
              </div>
            </div>

            {/* Issues */}
            {diagnostics.issues && diagnostics.issues.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
                <h3 className="font-bold mb-2">❌ Issues Found:</h3>
                <ul className="list-disc list-inside text-sm">
                  {diagnostics.issues.map((issue: string, i: number) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
                <div className="mt-4">
                  <Button onClick={handleAutoRepair} size="sm">
                    🔧 Auto-Fix These Issues
                  </Button>
                </div>
              </div>
            )}

            {/* All Keys */}
            <div className="mb-6">
              <h3 className="font-bold mb-2">🔑 All localStorage Keys:</h3>
              <div className="bg-muted rounded-lg p-4 font-mono text-xs">
                {diagnostics.keys.length === 0 ? (
                  <div className="text-muted-foreground">No keys found</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {diagnostics.keys.map((key: string) => (
                      <span
                        key={key}
                        className="bg-background px-2 py-1 rounded border border-border"
                      >
                        {key}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Validation */}
            <div>
              <h3 className="font-bold mb-2">🔍 Detailed Validation:</h3>
              <div className="bg-muted rounded-lg p-4">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(diagnostics.validation, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiagnosticPage;
