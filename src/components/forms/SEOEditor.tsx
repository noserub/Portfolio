import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Globe, Image, Hash, Link as LinkIcon, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getSEOData, saveSEOData, type AllSEOData, type SEOData, uploadFaviconToSupabase, saveFaviconToSupabase, getFaviconFromSupabase } from '../../utils/seoManager';
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
      loadFaviconFromSupabase();
      setSeoData(getSEOData());
      setHasChanges(false);
    }
  }, [isOpen]);

  const loadFaviconFromSupabase = async () => {
    try {
      const faviconUrl = await getFaviconFromSupabase();
      if (faviconUrl) {
        setSeoData(prev => ({
          ...prev,
          sitewide: { 
            ...prev.sitewide, 
            faviconType: 'image',
            faviconImageUrl: faviconUrl 
          },
        }));
      }
    } catch (error) {
      console.error('Error loading favicon from Supabase:', error);
    }
  };

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

  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    let loadingToast: string | number | undefined;
    
    try {
      // Show loading toast
      loadingToast = toast.loading('Uploading favicon to Supabase...');

      // Upload to Supabase Storage
      const faviconUrl = await uploadFaviconToSupabase(file);
      
      if (!faviconUrl) {
        toast.dismiss(loadingToast);
        toast.error('Failed to upload favicon to Supabase. Please try again.');
        return;
      }

      // Save favicon URL to database
      const saved = await saveFaviconToSupabase(faviconUrl);
      
      if (!saved) {
        toast.dismiss(loadingToast);
        toast.error('Failed to save favicon settings. Please try again.');
        return;
      }

      // Update local state
      setSeoData(prev => ({
        ...prev,
        sitewide: { 
          ...prev.sitewide, 
          faviconType: 'image',
          faviconImageUrl: faviconUrl 
        },
      }));
      setHasChanges(true);
      toast.dismiss(loadingToast);
      toast.success('Favicon uploaded and saved to Supabase!');
    } catch (error) {
      console.error('Error uploading favicon:', error);
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
      toast.error('Error uploading favicon. Please try again.');
    }
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
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Search className="w-4 h-4 text-purple-400" />
          <h3 className="text-foreground">Basic SEO</h3>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`${pageName}-title`} className="text-muted-foreground">Page Title</Label>
          <Input
            id={`${pageName}-title`}
            value={pageData.title}
            onChange={(e) => updateFn('title', e.target.value)}
            className="bg-background border-border text-foreground"
            placeholder="Page title (shown in browser tab)"
          />
          <p className="text-xs text-foreground/50">Recommended: 50-60 characters</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${pageName}-description`} className="text-muted-foreground">Meta Description</Label>
          <Textarea
            id={`${pageName}-description`}
            value={pageData.description}
            onChange={(e) => updateFn('description', e.target.value)}
            className="bg-background border-border text-foreground min-h-[80px]"
            placeholder="Brief description for search engines"
          />
          <p className="text-xs text-foreground/50">Recommended: 150-160 characters</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${pageName}-keywords`} className="text-muted-foreground">Keywords</Label>
          <Input
            id={`${pageName}-keywords`}
            value={pageData.keywords}
            onChange={(e) => updateFn('keywords', e.target.value)}
            className="bg-background border-border text-foreground"
            placeholder="keyword1, keyword2, keyword3"
          />
          <p className="text-xs text-foreground/50">Comma-separated list of relevant keywords</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${pageName}-canonical`} className="text-muted-foreground">Canonical URL</Label>
          <Input
            id={`${pageName}-canonical`}
            value={pageData.canonicalUrl || ''}
            onChange={(e) => updateFn('canonicalUrl', e.target.value)}
            className="bg-background border-border text-foreground"
            placeholder="https://brianbureson.com/page-url"
          />
          <p className="text-xs text-foreground/50">Optional: Preferred URL for this page</p>
        </div>
      </div>

      {/* Open Graph */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Globe className="w-4 h-4 text-blue-400" />
          <h3 className="text-foreground">Open Graph (Facebook, LinkedIn)</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${pageName}-og-title`} className="text-muted-foreground">OG Title</Label>
          <Input
            id={`${pageName}-og-title`}
            value={pageData.ogTitle || ''}
            onChange={(e) => updateFn('ogTitle', e.target.value)}
            className="bg-background border-border text-foreground"
            placeholder="Leave empty to use page title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${pageName}-og-description`} className="text-muted-foreground">OG Description</Label>
          <Textarea
            id={`${pageName}-og-description`}
            value={pageData.ogDescription || ''}
            onChange={(e) => updateFn('ogDescription', e.target.value)}
            className="bg-background border-border text-foreground min-h-[60px]"
            placeholder="Leave empty to use meta description"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${pageName}-og-image`} className="text-muted-foreground">OG Image URL</Label>
          <Input
            id={`${pageName}-og-image`}
            value={pageData.ogImage || ''}
            onChange={(e) => updateFn('ogImage', e.target.value)}
            className="bg-background border-border text-foreground"
            placeholder="https://example.com/image.jpg"
          />
          <p className="text-xs text-foreground/50">Recommended: 1200x630px</p>
        </div>
      </div>

      {/* Twitter Card */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Hash className="w-4 h-4 text-cyan-400" />
          <h3 className="text-foreground">Twitter Card</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${pageName}-twitter-card`} className="text-muted-foreground">Card Type</Label>
          <Select
            value={pageData.twitterCard || 'summary_large_image'}
            onValueChange={(value) => updateFn('twitterCard', value as 'summary' | 'summary_large_image')}
          >
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Summary</SelectItem>
              <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${pageName}-twitter-title`} className="text-muted-foreground">Twitter Title</Label>
          <Input
            id={`${pageName}-twitter-title`}
            value={pageData.twitterTitle || ''}
            onChange={(e) => updateFn('twitterTitle', e.target.value)}
            className="bg-background border-border text-foreground"
            placeholder="Leave empty to use OG title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${pageName}-twitter-description`} className="text-muted-foreground">Twitter Description</Label>
          <Textarea
            id={`${pageName}-twitter-description`}
            value={pageData.twitterDescription || ''}
            onChange={(e) => updateFn('twitterDescription', e.target.value)}
            className="bg-background border-border text-foreground min-h-[60px]"
            placeholder="Leave empty to use OG description"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${pageName}-twitter-image`} className="text-muted-foreground">Twitter Image URL</Label>
          <Input
            id={`${pageName}-twitter-image`}
            value={pageData.twitterImage || ''}
            onChange={(e) => updateFn('twitterImage', e.target.value)}
            className="bg-background border-border text-foreground"
            placeholder="Leave empty to use OG image"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{ top: '85px' }}>
      <div className="bg-background border border-border rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Search className="w-6 h-6 text-primary" />
            <h2 className="text-2xl text-foreground">SEO Optimization</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="sitewide" className="w-full">
            <TabsList className="bg-muted border border-border mb-6 flex-wrap h-auto">
              <TabsTrigger value="sitewide" className="text-muted-foreground data-[state=active]:text-pink-500 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 data-[state=active]:font-bold">Site Settings</TabsTrigger>
              <TabsTrigger value="home" className="text-muted-foreground data-[state=active]:text-pink-500 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 data-[state=active]:font-bold">Home</TabsTrigger>
              <TabsTrigger value="about" className="text-muted-foreground data-[state=active]:text-pink-500 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 data-[state=active]:font-bold">About</TabsTrigger>
              <TabsTrigger value="caseStudies" className="text-muted-foreground data-[state=active]:text-pink-500 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 data-[state=active]:font-bold">Case Studies</TabsTrigger>
              <TabsTrigger value="contact" className="text-muted-foreground data-[state=active]:text-pink-500 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 data-[state=active]:font-bold">Contact</TabsTrigger>
              <TabsTrigger value="caseStudyTemplate" className="text-muted-foreground data-[state=active]:text-pink-500 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 data-[state=active]:font-bold">Case Study Template</TabsTrigger>
            </TabsList>

            {/* Sitewide Settings */}
            <TabsContent value="sitewide" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                  <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-foreground">Global Settings</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site-name" className="text-muted-foreground">Site Name</Label>
                  <Input
                    id="site-name"
                    value={seoData.sitewide.siteName}
                    onChange={(e) => updateSitewide('siteName', e.target.value)}
                    className="bg-background border-border text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site-url" className="text-muted-foreground">Site URL</Label>
                  <Input
                    id="site-url"
                    value={seoData.sitewide.siteUrl}
                    onChange={(e) => updateSitewide('siteUrl', e.target.value)}
                    className="bg-background border-border text-foreground"
                    placeholder="https://brianbureson.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-author" className="text-muted-foreground">Default Author</Label>
                  <Input
                    id="default-author"
                    value={seoData.sitewide.defaultAuthor}
                    onChange={(e) => updateSitewide('defaultAuthor', e.target.value)}
                    className="bg-background border-border text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-og-image" className="text-muted-foreground">Default OG Image URL</Label>
                  <Input
                    id="default-og-image"
                    value={seoData.sitewide.defaultOGImage}
                    onChange={(e) => updateSitewide('defaultOGImage', e.target.value)}
                    className="bg-background border-border text-foreground"
                    placeholder="https://example.com/default-share-image.jpg"
                  />
                  <p className="text-xs text-foreground/50">Used when page doesn't have a specific OG image</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-twitter-card" className="text-muted-foreground">Default Twitter Card Type</Label>
                  <Select
                    value={seoData.sitewide.defaultTwitterCard}
                    onValueChange={(value) => updateSitewide('defaultTwitterCard', value)}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
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
                <div className="flex items-center gap-2 pb-2 border-b border-border bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                  <Image className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                  <h3 className="text-foreground">Favicon Customization</h3>
                </div>

                {/* Favicon Type Selection */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Favicon Type</Label>
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
                      <span className="text-foreground text-sm">Text Favicon (Generated)</span>
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
                      <span className="text-foreground text-sm">Custom Image</span>
                    </label>
                  </div>
                </div>

                {/* Custom Image Upload */}
                {seoData.sitewide.faviconType === 'image' && (
                  <div className="space-y-3 p-4 bg-white/5 border border-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label className="text-muted-foreground">Upload Favicon Image</Label>
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
                      className="w-full bg-white/5 border-white/20 text-foreground hover:bg-white/10"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Image File
                    </Button>
                    
                    <div className="text-xs text-foreground/50 space-y-1">
                      <p>• Supported formats: PNG, JPG, SVG, ICO</p>
                      <p>• Recommended size: 32x32 or 64x64 pixels</p>
                      <p>• Maximum file size: 500KB</p>
                      <p>• Square images work best</p>
                    </div>

                    {seoData.sitewide.faviconImageUrl && (
                      <div className="flex items-center gap-3 pt-2 border-t border-border">
                        <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                          <img 
                            src={seoData.sitewide.faviconImageUrl} 
                            alt="Favicon preview" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 text-xs text-foreground/60">
                          <p className="text-foreground/80">✓ Custom image uploaded</p>
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
                    <Label htmlFor="favicon-text" className="text-muted-foreground">Favicon Text</Label>
                    <Input
                      id="favicon-text"
                      value={seoData.sitewide.faviconText || 'BB'}
                      onChange={(e) => updateSitewide('faviconText', e.target.value)}
                      className="bg-background border-border text-foreground"
                      placeholder="BB"
                      maxLength={3}
                    />
                    <p className="text-xs text-foreground/50">1-3 characters (e.g., BB, B, 👋)</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="favicon-gradient-start" className="text-muted-foreground">Gradient Start Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="favicon-gradient-start"
                        type="color"
                        value={seoData.sitewide.faviconGradientStart || '#8b5cf6'}
                        onChange={(e) => updateSitewide('faviconGradientStart', e.target.value)}
                        className="bg-background border-border w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={seoData.sitewide.faviconGradientStart || '#8b5cf6'}
                        onChange={(e) => updateSitewide('faviconGradientStart', e.target.value)}
                        className="bg-background border-border text-foreground flex-1"
                        placeholder="#8b5cf6"
                      />
                    </div>
                    <p className="text-xs text-foreground/50">Top-left gradient color</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="favicon-gradient-end" className="text-muted-foreground">Gradient End Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="favicon-gradient-end"
                        type="color"
                        value={seoData.sitewide.faviconGradientEnd || '#3b82f6'}
                        onChange={(e) => updateSitewide('faviconGradientEnd', e.target.value)}
                        className="bg-background border-border w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={seoData.sitewide.faviconGradientEnd || '#3b82f6'}
                        onChange={(e) => updateSitewide('faviconGradientEnd', e.target.value)}
                        className="bg-background border-border text-foreground flex-1"
                        placeholder="#3b82f6"
                      />
                    </div>
                    <p className="text-xs text-foreground/50">Bottom-right gradient color</p>
                  </div>
                </div>
                )}

                {/* Favicon Preview */}
                <div className="p-4 bg-white/5 border border-border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Preview:</p>
                      {seoData.sitewide.faviconType === 'image' && seoData.sitewide.faviconImageUrl ? (
                        <div className="w-16 h-16 bg-gray-600 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden shadow-lg border-2 border-gray-400 dark:border-gray-600">
                          <img 
                            src={seoData.sitewide.faviconImageUrl} 
                            alt="Favicon preview" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div 
                          className="w-16 h-16 rounded-lg flex items-center justify-center text-foreground shadow-lg"
                          style={{
                            background: `linear-gradient(135deg, ${seoData.sitewide.faviconGradientStart || '#8b5cf6'}, ${seoData.sitewide.faviconGradientEnd || '#3b82f6'})`
                          }}
                        >
                          <span className="text-2xl font-bold">{seoData.sitewide.faviconText || 'BB'}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-xs text-foreground/60">
                      <p>Your favicon will appear in:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Browser tabs</li>
                        <li>Bookmarks</li>
                        <li>Browser history</li>
                        <li>Mobile home screen (when saved)</li>
                      </ul>
                      <p className="mt-2 text-foreground/50 italic">Save and reload the page to see changes</p>
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
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/50">
          <p className="text-sm text-foreground/50">
            {hasChanges && <span className="text-yellow-400">● Unsaved changes</span>}
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
