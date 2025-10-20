import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { uploadImage } from '../utils/imageHelpers';

export const SupabaseImageTest: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      console.log('🧪 Testing Supabase image upload...');
      const url = await uploadImage(selectedFile, 'landscape');
      setUploadedUrl(url);
      console.log('✅ Upload successful:', url);
    } catch (err) {
      console.error('❌ Upload failed:', err);
      setError('Upload failed: ' + (err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Supabase Image Upload Test</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Select Image</label>
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full"
          />
        </div>

        {selectedFile && (
          <div className="text-sm text-gray-600">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full"
        >
          {isUploading ? 'Uploading...' : 'Upload to Supabase'}
        </Button>

        {error && (
          <div className="text-red-600 text-sm">
            {error}
          </div>
        )}

        {uploadedUrl && (
          <div className="space-y-2">
            <div className="text-green-600 text-sm">
              ✅ Upload successful!
            </div>
            <div className="text-xs text-gray-500 break-all">
              URL: {uploadedUrl}
            </div>
            <div className="mt-2">
              <img
                src={uploadedUrl}
                alt="Uploaded"
                className="w-full h-32 object-cover rounded"
                onError={() => setError('Image failed to load')}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
