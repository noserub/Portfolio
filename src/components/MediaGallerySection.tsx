import { useState } from 'react';
import { motion } from 'motion/react';
import { Image as ImageIcon, Video as VideoIcon, Trash2 } from 'lucide-react';
import { FlowDiagramGallery } from './FlowDiagramGallery';
import { VideoGallery } from './VideoGallery';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import type { CaseStudyGallerySection, GalleryAspectRatio } from '../types/caseStudySections';

interface MediaGallerySectionProps {
  section: CaseStudyGallerySection;
  isEditMode?: boolean;
  showDecorativeIcons?: boolean;
  onSectionChange: (section: CaseStudyGallerySection) => void;
  onRemove?: () => void;
  onImageClick?: (image: { id: string; url: string; alt: string; caption?: string }) => void;
}

const IMAGE_ASPECT_RATIOS: GalleryAspectRatio[] = ['3x4', '4x3', '2x3', '3x2', '16x9'];
const VIDEO_ASPECT_RATIOS: GalleryAspectRatio[] = ['3x4', '4x3', '2x3', '3x2', '16x9', '9x16'];

export function MediaGallerySection({
  section,
  isEditMode = false,
  showDecorativeIcons = false,
  onSectionChange,
  onRemove,
  onImageClick,
}: MediaGallerySectionProps) {
  const [showSettings, setShowSettings] = useState(false);
  const { gallery } = section;
  const isVideo = gallery.mediaMode === 'video';
  const aspectOptions = isVideo ? VIDEO_ASPECT_RATIOS : IMAGE_ASPECT_RATIOS;

  const patch = (partial: Partial<CaseStudyGallerySection>) => {
    onSectionChange({ ...section, ...partial });
  };

  const patchGallery = (partial: Partial<CaseStudyGallerySection['gallery']>) => {
    onSectionChange({
      ...section,
      gallery: { ...gallery, ...partial },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="case-study-gallery-section p-8 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md rounded-2xl border border-border/30 shadow-lg"
    >
      <div className="case-study-gallery-section__header flex items-center justify-between gap-3 mb-8 min-w-0">
        <div className="flex items-center min-w-0 flex-1 gap-3">
          {showDecorativeIcons && (
            <div className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl text-purple-600 dark:text-purple-400 shadow-md flex-shrink-0">
              {isVideo ? <VideoIcon className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
            </div>
          )}
          {isEditMode ? (
            <Input
              value={section.title}
              onChange={(e) => patch({ title: e.target.value })}
              className="text-xl font-semibold"
              placeholder="Gallery title"
            />
          ) : (
            <h3 className="case-study-gallery-section__title m-0 min-w-0 flex-1 text-left text-xl font-semibold leading-tight">
              {section.title}
            </h3>
          )}
        </div>
        {isEditMode && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowSettings((v) => !v)}>
              Settings
            </Button>
            {onRemove && (
              <Button type="button" variant="destructive" size="sm" onClick={onRemove}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {isEditMode && showSettings && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl border border-border/40 bg-card/40">
          <div className="space-y-2">
            <Label>Media type</Label>
            <Select
              value={gallery.mediaMode}
              onValueChange={(value: 'image' | 'video') => patchGallery({ mediaMode: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Preview limit</Label>
            <Input
              type="number"
              min={0}
              placeholder="Auto"
              value={gallery.previewLimit ?? ''}
              onChange={(e) => {
                const raw = e.target.value.trim();
                patchGallery({
                  previewLimit: raw === '' ? null : Math.max(0, Number(raw) || 0),
                });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Show more label</Label>
            <Input
              value={gallery.showMoreLabel || ''}
              onChange={(e) => patchGallery({ showMoreLabel: e.target.value || 'Show more' })}
              placeholder="Show more"
            />
          </div>
        </div>
      )}

      {isVideo ? (
        <VideoGallery
          videos={gallery.videoItems}
          onVideosChange={(videos) => patchGallery({ videoItems: videos })}
          isEditMode={isEditMode}
          aspectRatio={gallery.aspectRatio as '3x4' | '4x3' | '2x3' | '3x2' | '16x9' | '9x16'}
          onAspectRatioChange={(ratio) => patchGallery({ aspectRatio: ratio })}
          columns={gallery.columns}
          onColumnsChange={(columns) => patchGallery({ columns })}
        />
      ) : (
        <FlowDiagramGallery
          images={gallery.imageItems}
          onImagesChange={(images) => patchGallery({ imageItems: images })}
          onImageClick={onImageClick || (() => {})}
          isEditMode={isEditMode}
          aspectRatio={gallery.aspectRatio as '3x4' | '4x3' | '2x3' | '3x2' | '16x9'}
          onAspectRatioChange={(ratio) => patchGallery({ aspectRatio: ratio })}
          columns={gallery.columns}
          onColumnsChange={(columns) => patchGallery({ columns })}
          previewLimit={gallery.previewLimit}
          showMoreLabel={gallery.showMoreLabel}
        />
      )}
    </motion.div>
  );
}

export default MediaGallerySection;
