import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Upload, FileText, Database, CheckCircle, XCircle } from 'lucide-react';
import { importFromJSON, importFromLocalStorage } from '../utils/importData';

export function DataImporter() {
  const [jsonData, setJsonData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setJsonData(content);
      };
      reader.readAsText(file);
    }
  };

  const handleImportFromJSON = async () => {
    if (!jsonData.trim()) {
      alert('Please paste or upload JSON data first');
      return;
    }

    setIsImporting(true);
    try {
      const parsedData = JSON.parse(jsonData);
      const results = await importFromJSON(parsedData);
      setImportResults(results);
    } catch (error: any) {
      setImportResults({
        errors: [`Failed to parse JSON: ${error.message}`]
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportFromLocalStorage = async () => {
    setIsImporting(true);
    try {
      const results = await importFromLocalStorage();
      setImportResults(results);
    } catch (error: any) {
      setImportResults({
        errors: [`Failed to import from localStorage: ${error.message}`]
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Importer
          </CardTitle>
          <CardDescription>
            Import your portfolio data from JSON files or localStorage to Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* JSON Import Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Import from JSON File</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload JSON File</label>
              <Input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Or Paste JSON Data</label>
              <Textarea
                placeholder="Paste your JSON data here..."
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <Button 
              onClick={handleImportFromJSON}
              disabled={isImporting || !jsonData.trim()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? 'Importing...' : 'Import from JSON'}
            </Button>
          </div>

          {/* LocalStorage Import Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Import from localStorage</h3>
            <p className="text-sm text-muted-foreground">
              Import any existing data from your browser's localStorage
            </p>
            
            <Button 
              onClick={handleImportFromLocalStorage}
              disabled={isImporting}
              variant="outline"
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              {isImporting ? 'Importing...' : 'Import from localStorage'}
            </Button>
          </div>

          {/* Results */}
          {importResults && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Import Results</h3>
              
              {importResults.errors && importResults.errors.length > 0 ? (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-semibold">Import failed with errors:</p>
                      {importResults.errors.map((error: string, index: number) => (
                        <p key={index} className="text-sm">• {error}</p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-semibold">Import successful!</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {importResults.profiles > 0 && <p>• {importResults.profiles} profiles</p>}
                        {importResults.projects > 0 && <p>• {importResults.projects} projects</p>}
                        {importResults.contactMessages > 0 && <p>• {importResults.contactMessages} contact messages</p>}
                        {importResults.seoData > 0 && <p>• {importResults.seoData} SEO records</p>}
                        {importResults.pageVisibility > 0 && <p>• {importResults.pageVisibility} page visibility records</p>}
                        {importResults.appSettings > 0 && <p>• {importResults.appSettings} app settings</p>}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-2">
            <h4 className="font-semibold">JSON Format</h4>
            <p className="text-sm text-muted-foreground">
              Your JSON should contain one or more of these arrays:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li><code>profiles</code> - About page content</li>
              <li><code>projects</code> - Case studies and design projects</li>
              <li><code>contactMessages</code> - Contact form submissions</li>
              <li><code>seoData</code> - SEO settings</li>
              <li><code>pageVisibility</code> - Page visibility settings</li>
              <li><code>appSettings</code> - App configuration</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
