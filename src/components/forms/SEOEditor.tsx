import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Globe, Image, Hash, Link as LinkIcon, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getSEOData, saveSEOData, type AllSEOData, type SEOData } from '../../utils/seoManager';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface SEOEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SEOEditor({ isOpen, onClose }: SEOEditorProps) {
  const [seoData, setSeoData] = useState<AllSEOData>(getSEOData());
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSeoData(getSEOData());
      setHasChanges(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveSEOData(seoData);
    setHasChanges(false);
    // Reload the page to apply new SEO settings
    window.location.reload();
  };

  const updateSitewide = (field: keyof AllSEOData['sitewide'], value: string) => {
    setSeoData(prev => ({
      ...prev,
      sitewide: { ...prev.sitewide, [field]: value },
    }));
    setHasChanges(true);
  };

  const handleFaviconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a PNG, JPG, SVG, or ICO file.');
      return;
    }

    // Validate file size (max 500KB for favicon)
    const maxSize = 500 * 1024; // 500KB
    if (file.size > maxSize) {
      toast.error('File too large. Please upload an image smaller than 500KB.');
      return;
    }

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setSeoData(prev => ({
        ...prev,
        sitewide: { 
          ...prev.sitewide, 
          faviconType: 'image',
          faviconImageUrl: dataUrl 
        },
      }));
      setHasChanges(true);
      toast.success('Favicon uploaded successfully!');
    };
    reader.onerror = () => {
      toast.error('Error reading file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFavicon = () => {
    setSeoData(prev => ({
      ...prev,
      sitewide: { 
        ...prev.sitewide, 
        faviconType: 'text',
        faviconImageUrl: '' 
      },
    }));
    setHasChanges(true);
    toast.success('Custom favicon removed. Using text favicon.');
  };

  const updatePageSEO = (page: keyof AllSEOData['pages'], field: keyof SEOData, value: string) => {
    setSeoData(prev => ({
      ...prev,
      pages: {
        ...prev.pages,
        [page]: { ...prev.pages[page], [field]: value },
      },
    }));
    setHasChanges(true);
  };

  const updateCaseStudyDefaults = (field: keyof SEOData, value: string) => {
    setSeoData(prev => ({
      ...prev,
      caseStudyDefaults: { ...prev.caseStudyDefaults, [field]: value },
    }));
    setHasChanges(true);
  };

  const renderPageSEOForm = (
    pageName: keyof AllSEOData['pages'],
    pageData: SEOData,
    updateFn: (field: keyof SEOData, value: string) => void
  ) => (
    <div className="space-y-6">
      {/* Basic SEO */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10">
          <Search className="w-4 h-4 text-purple-400" />
          <h3 className="text-white">Basic SEO</h3>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`${pageName}-title`} className="text-white/70">Page Title</Label>
          <Input
            id={`${pageName}-title`}
            value={pageData.title}
            onChange={(e) => updateFn('title', e.target.value)}
            className="bg-white/5 border-white/10 text-white"
            placeholder="Page title (shown in browser tab)"
          />
          <p className="text-xs text-white/50">Recommended: 50-60 characters</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${pageName}-description`} className="text-white/70">Meta Description</Label>
          <Textarea
            id={`${pageName}-description`}
            value={pageData.description}
            onChange={(e) => updateFn('description', e.target.value)}
            className="bg-white/5 border-white/10 text-white min-h-[80px]"
            placeholder="Brief description for search engines"
          />
          <p className="text-xs text-white/50">Recommended: 150-160 characters</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${pageName}-keywords`} className="text-white/70">Keywords</Label>
          <Input
            id={`${pageName}-keywords`}
            value={pageData.keywords}
            onChange={(e) => updateFn('keywords', e.target.value)}
            className="bg-white/5 border-white/10 text-white"
            placeholder="keyword1, keyword2, keyword3"
          />
          <p className="text-xs text-white/50">Comma-separated list of relevant keywords</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${pageName}-canonical`} className="text-white/70">Canonical URL</Label>
          <Input
            id={`${pageName}-canonical`}
            value={pageData.canonicalUrl || ''}
            onChange={(e) => updateFn('canonicalUrl', e.target.value)}
            className="bg-white/5 border-white/10 text-white"
            placeholder="https://brianbureson.com/page-url"
          />
          <p className="text-xs text-white/50">Optional: Preferred URL for this page</p>
        </div>
      </div>

      {/* Open Graph */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10">
          <Globe className="w-4 h-4 text-blue-400" />
          <h3 className="text-white">Open Graph (Facebook, LinkedIn)</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${pageName}-og-title`} className="text-white/70">OG Title</Label>
          <Input
            id={`${pageName}-og-title`}
            value={pageData.ogTitle || ''}
            onChange={(e) => updateFn('ogTitle', e.target.value)}
            className="bg-white/5 border-white/10 text-white"
            placeholder="Leave empty to use page title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${pageName}-og-description`} className="text-white/70">OG Description</Label>
          <Textarea
            id={`${pageName}-og-description`}
            value={pageData.ogDescription || ''}
            onChange={(e) => updateFn('ogDescription', e.target.value)}
            className="bg-white/5 border-white/10 text-white min-h-[60px]"
            placeholder="Leave empty to use meta description"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${pageName}-og-image`} className="text-white/70">OG Image URL</Label>
          <Input
            id={`${pageName}-og-image`}
            value={pageData.ogImage || ''}
            onChange={(e) => updateFn('ogImage', e.target.value)}
            className="bg-white/5 border-white/10 text-white"
            placeholder="https://example.com/image.jpg"
          />
          <p className="text-xs text-white/50">Recommended: 1200x630px</p>
        </div>
      </div>

      {/* Twitter Card */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10">
          <Hash className="w-4 h-4 text-cyan-400" />
          <h3 className="text-white">Twitter Card</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${pageName}-twitter-card`} className="text-white/70">Card Type</Label>
          <Select
            value={pageData.twitterCard || 'summary_large_image'}
            onValueChange={(value) => updateFn('twitterCard', value as 'summary' | 'summary_large_image')}
          >
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Summary</SelectItem>
              <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${pageName}-twitter-title`} className="text-white/70">Twitter Title</Label>
          <Input
            id={`${pageName}-twitter-title`}
            value={pageData.twitterTitle || ''}
            onChange={(e) => updateFn('twitterTitle', e.target.value)}
            className="bg-white/5 border-white/10 text-white"
            placeholder="Leave empty to use OG title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${pageName}-twitter-description`} className="text-white/70">Twitter Description</Label>
          <Textarea
            id={`${pageName}-twitter-description`}
            value={pageData.twitterDescription || ''}
            onChange={(e) => updateFn('twitterDescription', e.target.value)}
            className="bg-white/5 border-white/10 text-white min-h-[60px]"
            placeholder="Leave empty to use OG description"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${pageName}-twitter-image`} className="text-white/70">Twitter Image URL</Label>
          <Input
            id={`${pageName}-twitter-image`}
            value={pageData.twitterImage || ''}
            onChange={(e) => updateFn('twitterImage', e.target.value)}
            className="bg-white/5 border-white/10 text-white"
            placeholder="Leave empty to use OG image"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Search className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl text-white">SEO Optimization</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="sitewide" className="w-full">
            <TabsList className="bg-white/5 border border-white/10 mb-6 flex-wrap h-auto">
              <TabsTrigger value="sitewide" className="text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/10">Site Settings</TabsTrigger>
              <TabsTrigger value="home" className="text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/10">Home</TabsTrigger>
              <TabsTrigger value="about" className="text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/10">About</TabsTrigger>
              <TabsTrigger value="caseStudies" className="text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/10">Case Studies</TabsTrigger>
              <TabsTrigger value="contact" className="text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/10">Contact</TabsTrigger>
              <TabsTrigger value="music" className="text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/10">Music</TabsTrigger>
              <TabsTrigger value="visuals" className="text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/10">Visuals</TabsTrigger>
              <TabsTrigger value="caseStudyTemplate" className="text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/10">Case Study Template</TabsTrigger>
            </TabsList>

            {/* Sitewide Settings */}
            <TabsContent value="sitewide" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                  <Globe className="w-4 h-4 text-purple-400" />
                  <h3 className="text-white">Global Settings</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site-name" className="text-white/70">Site Name</Label>
                  <Input
                    id="site-name"
                    value={seoData.sitewide.siteName}
                    onChange={(e) => updateSitewide('siteName', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site-url" className="text-white/70">Site URL</Label>
                  <Input
                    id="site-url"
                    value={seoData.sitewide.siteUrl}
                    onChange={(e) => updateSitewide('siteUrl', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="https://brianbureson.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-author" className="text-white/70">Default Author</Label>
                  <Input
                    id="default-author"
                    value={seoData.sitewide.defaultAuthor}
                    onChange={(e) => updateSitewide('defaultAuthor', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-og-image" className="text-white/70">Default OG Image URL</Label>
                  <Input
                    id="default-og-image"
                    value={seoData.sitewide.defaultOGImage}
                    onChange={(e) => updateSitewide('defaultOGImage', e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="https://example.com/default-share-image.jpg"
                  />
                  <p className="text-xs text-white/50">Used when page doesn't have a specific OG image</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-twitter-card" className="text-white/70">Default Twitter Card Type</Label>
                  <Select
                    value={seoData.sitewide.defaultTwitterCard}
                    onValueChange={(value) => updateSitewide('defaultTwitterCard', value)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Summary</SelectItem>
                      <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Favicon Customization */}
              <div className="space-y-4 mt-8">
                <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                  <Image className="w-4 h-4 text-pink-400" />
                  <h3 className="text-white">Favicon Customization</h3>
                </div>

                {/* Favicon Type Selection */}
                <div className="space-y-2">
                  <Label className="text-white/70">Favicon Type</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="faviconType"
                        value="text"
                        checked={seoData.sitewide.faviconType !== 'image'}
                        onChange={() => updateSitewide('faviconType', 'text')}
                        className="w-4 h-4"
                      />
                      <span className="text-white text-sm">Text Favicon (Generated)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="faviconType"
                        value="image"
                        checked={seoData.sitewide.faviconType === 'image'}
                        onChange={() => updateSitewide('faviconType', 'image')}
                        className="w-4 h-4"
                      />
                      <span className="text-white text-sm">Custom Image</span>
                    </label>
                  </div>
                </div>

                {/* Custom Image Upload */}
                {seoData.sitewide.faviconType === 'image' && (
                  <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label className="text-white/70">Upload Favicon Image</Label>
                      {seoData.sitewide.faviconImageUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFavicon}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/x-icon"
                      onChange={handleFaviconUpload}
                      className="hidden"
                    />
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Image File
                    </Button>
                    
                    <div className="text-xs text-white/50 space-y-1">
                      <p>• Supported formats: PNG, JPG, SVG, ICO</p>
                      <p>• Recommended size: 32x32 or 64x64 pixels</p>
                      <p>• Maximum file size: 500KB</p>
                      <p>• Square images work best</p>
                    </div>

                    {seoData.sitewide.faviconImageUrl && (
                      <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                        <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                          <img 
                            src={seoData.sitewide.faviconImageUrl} 
                            alt="Favicon preview" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 text-xs text-white/60">
                          <p className="text-white/80">✓ Custom image uploaded</p>
                          <p className="mt-1">This image will be used as your favicon</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Text Favicon Options */}
                {seoData.sitewide.faviconType !== 'image' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="favicon-text" className="text-white/70">Favicon Text</Label>
                    <Input
                      id="favicon-text"
                      value={seoData.sitewide.faviconText || 'BB'}
                      onChange={(e) => updateSitewide('faviconText', e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="BB"
                      maxLength={3}
                    />
                    <p className="text-xs text-white/50">1-3 characters (e.g., BB, B, 👋)</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="favicon-gradient-start" className="text-white/70">Gradient Start Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="favicon-gradient-start"
                        type="color"
                        value={seoData.sitewide.faviconGradientStart || '#8b5cf6'}
                        onChange={(e) => updateSitewide('faviconGradientStart', e.target.value)}
                        className="bg-white/5 border-white/10 w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={seoData.sitewide.faviconGradientStart || '#8b5cf6'}
                        onChange={(e) => updateSitewide('faviconGradientStart', e.target.value)}
                        className="bg-white/5 border-white/10 text-white flex-1"
                        placeholder="#8b5cf6"
                      />
                    </div>
                    <p className="text-xs text-white/50">Top-left gradient color</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="favicon-gradient-end" className="text-white/70">Gradient End Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="favicon-gradient-end"
                        type="color"
                        value={seoData.sitewide.faviconGradientEnd || '#3b82f6'}
                        onChange={(e) => updateSitewide('faviconGradientEnd', e.target.value)}
                        className="bg-white/5 border-white/10 w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={seoData.sitewide.faviconGradientEnd || '#3b82f6'}
                        onChange={(e) => updateSitewide('faviconGradientEnd', e.target.value)}
                        className="bg-white/5 border-white/10 text-white flex-1"
                        placeholder="#3b82f6"
                      />
                    </div>
                    <p className="text-xs text-white/50">Bottom-right gradient color</p>
                  </div>
                </div>
                )}

                {/* Favicon Preview */}
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="space-y-2">
                      <p className="text-xs text-white/70">Preview:</p>
                      {seoData.sitewide.faviconType === 'image' && seoData.sitewide.faviconImageUrl ? (
                        <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden shadow-lg border-2 border-white/20">
                          <img 
                            src={seoData.sitewide.faviconImageUrl} 
                            alt="Favicon preview" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div 
                          className="w-16 h-16 rounded-lg flex items-center justify-center text-white shadow-lg"
                          style={{
                            background: `linear-gradient(135deg, ${seoData.sitewide.faviconGradientStart || '#8b5cf6'}, ${seoData.sitewide.faviconGradientEnd || '#3b82f6'})`
                          }}
                        >
                          <span className="text-2xl font-bold">{seoData.sitewide.faviconText || 'BB'}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-xs text-white/60">
                      <p>Your favicon will appear in:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Browser tabs</li>
                        <li>Bookmarks</li>
                        <li>Browser history</li>
                        <li>Mobile home screen (when saved)</li>
                      </ul>
                      <p className="mt-2 text-white/50 italic">Save and reload the page to see changes</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Page-specific tabs */}
            <TabsContent value="home">
              {renderPageSEOForm('home', seoData.pages.home, (field, value) => 
                updatePageSEO('home', field, value)
              )}
            </TabsContent>

            <TabsContent value="about">
              {renderPageSEOForm('about', seoData.pages.about, (field, value) => 
                updatePageSEO('about', field, value)
              )}
            </TabsContent>

            <TabsContent value="caseStudies">
              {renderPageSEOForm('caseStudies', seoData.pages.caseStudies, (field, value) => 
                updatePageSEO('caseStudies', field, value)
              )}
            </TabsContent>

            <TabsContent value="contact">
              {renderPageSEOForm('contact', seoData.pages.contact, (field, value) => 
                updatePageSEO('contact', field, value)
              )}
            </TabsContent>

            <TabsContent value="music">
              {renderPageSEOForm('music', seoData.pages.music, (field, value) => 
                updatePageSEO('music', field, value)
              )}
            </TabsContent>

            <TabsContent value="visuals">
              {renderPageSEOForm('visuals', seoData.pages.visuals, (field, value) => 
                updatePageSEO('visuals', field, value)
              )}
            </TabsContent>

            <TabsContent value="caseStudyTemplate">
              <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-300">
                  These are the default SEO settings for individual case studies. You can override them for specific case studies from the case study detail page in edit mode.
                </p>
              </div>
              {renderPageSEOForm('caseStudyTemplate', seoData.caseStudyDefaults, (field, value) => 
                updateCaseStudyDefaults(field, value)
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10 bg-black/40">
          <p className="text-sm text-white/50">
            {hasChanges && <span className="text-yellow-400">● Unsaved changes</span>}
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Save & Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SEOEditor;
