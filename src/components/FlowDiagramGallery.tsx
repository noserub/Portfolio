import { useState, useRef } from "react";
import { motion } from "motion/react";
import { Upload, X, Edit2, Check, ZoomIn, ZoomOut, Move, RotateCcw, Maximize2, ArrowUp, ArrowDown, Image as ImageIcon, Camera } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface FlowDiagramImage {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  scale?: number;
  position?: { x: number; y: number };
}

export type AspectRatio = "3x4" | "4x3" | "2x3" | "3x2" | "16x9";

interface FlowDiagramGalleryProps {
  images: FlowDiagramImage[];
  onImagesChange: (images: FlowDiagramImage[]) => void;
  onImageClick: (image: FlowDiagramImage) => void;
  isEditMode?: boolean;
  aspectRatio?: AspectRatio;
  onAspectRatioChange?: (ratio: AspectRatio) => void;
  columns?: 1 | 2 | 3;
  onColumnsChange?: (columns: 1 | 2 | 3) => void;
}

interface FlowDiagramItemProps {
  image: FlowDiagramImage;
  index: number;
  isEditMode: boolean;
  onRemove: (id: string) => void;
  onImageClick: (image: FlowDiagramImage) => void;
  onCaptionChange: (id: string, caption: string) => void;
  onImageUpdate: (id: string, updates: Partial<FlowDiagramImage>) => void;
  aspectRatio: AspectRatio;
  totalImages: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

function FlowDiagramItem({
  image,
  index,
  isEditMode,
  onRemove,
  onImageClick,
  onCaptionChange,
  onImageUpdate,
  aspectRatio,
  totalImages,
  onMoveUp,
  onMoveDown,
}: FlowDiagramItemProps) {
  const imageRef = useRef<HTMLDivElement>(null);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionValue, setCaptionValue] = useState(image.caption || "");
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [isDraggingPosition, setIsDraggingPosition] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  
  // Local state for position/scale during editing
  const [localPosition, setLocalPosition] = useState(() => image.position || { x: 50, y: 50 });
  const [localScale, setLocalScale] = useState(() => image.scale || 1);
  
  const scale = localScale;
  const position = localPosition;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative group"
    >

      <motion.div
        ref={imageRef}
        onClick={(e) => {
          if (isEditMode && isEditingImage) {
            return; // Don't open lightbox when editing
          }
          onImageClick(image);
        }}
        onMouseDown={(e) => {
          if (!isEditMode || !isEditingImage) return;
          
          e.preventDefault();
          setIsDraggingPosition(true);
          const imageEl = imageRef.current;
          if (!imageEl) return;

          const rect = imageEl.getBoundingClientRect();
          const startX = e.clientX;
          const startY = e.clientY;
          const startPosX = position.x;
          const startPosY = position.y;

          const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100;
            const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100;

            setLocalPosition({
              x: Math.max(0, Math.min(100, startPosX + deltaX)),
              y: Math.max(0, Math.min(100, startPosY + deltaY)),
            });
          };

          const handleMouseUp = () => {
            setIsDraggingPosition(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
        whileHover={!isEditingImage ? { scale: 1.02, y: -4 } : {}}
        className="overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all relative"
        style={{
          aspectRatio: aspectRatio === '3x4' ? '3 / 4' :
                      aspectRatio === '4x3' ? '4 / 3' :
                      aspectRatio === '2x3' ? '2 / 3' :
                      aspectRatio === '3x2' ? '3 / 2' :
                      '16 / 9',
          background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 25%, #3b82f6 50%, #06b6d4 75%, #fbbf24 100%)',
          cursor: isEditingImage ? (isDraggingPosition ? 'grabbing' : 'grab') : 'pointer'
        }}
      >
        <img
          src={image.url}
          alt=""
          className="w-full h-full"
          style={{
            objectFit: scale > 1 ? 'cover' : 'contain',
            transform: `scale(${scale})`,
            transformOrigin: `${position.x}% ${position.y}%`,
            transition: isDraggingPosition ? 'none' : 'transform 0.2s ease-out',
            opacity: imageLoadError ? 0 : 1
          }}
          draggable={false}
          onLoad={() => setImageLoadError(false)}
          onError={() => setImageLoadError(true)}
        />
        
        {/* Placeholder icon when image fails to load */}
        {imageLoadError && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Camera className="w-20 h-20 text-white/60" strokeWidth={1.5} />
          </div>
        )}
        
        {/* Image Editor Controls */}
        {isEditingImage && (
          <>
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 z-20 pointer-events-none">
              {/* Zoom Controls */}
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full p-2 border border-white/20 pointer-events-auto">
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full w-8 h-8 p-0 hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocalScale(Math.max(0.5, scale - 0.1));
                  }}
                >
                  <ZoomOut className="w-4 h-4 text-white" />
                </Button>
                <span className="text-white text-sm font-medium min-w-[3rem] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full w-8 h-8 p-0 hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocalScale(Math.min(3, scale + 0.1));
                  }}
                >
                  <ZoomIn className="w-4 h-4 text-white" />
                </Button>
              </div>

              {/* Fit Toggle */}
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 text-white pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocalScale(scale === 1 ? 1.5 : 1);
                }}
              >
                <Maximize2 className="w-4 h-4 mr-2" />
                {scale === 1 ? 'Fill' : 'Fit'}
              </Button>

              {/* Position Hint */}
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 pointer-events-auto">
                <Move className="w-4 h-4 text-white" />
                <span className="text-white text-sm">Drag image to reposition</span>
              </div>

              {/* Reset Button */}
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 text-white pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocalScale(1);
                  setLocalPosition({ x: 50, y: 50 });
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>

            {/* Done Button */}
            <Button
              size="sm"
              className="absolute bottom-4 right-4 z-30 shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                onImageUpdate(image.id, { scale: localScale, position: localPosition });
                setIsEditingImage(false);
              }}
            >
              Done
            </Button>
          </>
        )}
      </motion.div>
      
      {isEditMode && !isEditingImage && (
        <>
          {/* Control buttons in top-right corner */}
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
            {/* Move Up Button */}
            {index > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp?.();
                }}
                className="rounded-full p-2"
                aria-label="Move image up"
                title="Move image up"
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
            )}
            
            {/* Move Down Button */}
            {index < totalImages - 1 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown?.();
                }}
                className="rounded-full p-2"
                aria-label="Move image down"
                title="Move image down"
              >
                <ArrowDown className="w-4 h-4" />
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingImage(true);
              }}
              className="rounded-full p-2"
              aria-label="Edit image zoom/position"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(image.id);
              }}
              className="rounded-full p-2"
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
      
      {/* Caption - Hidden for placeholder images */}
      {!imageLoadError && (
        <div className="mt-3">
          {isEditMode ? (
            <div className="flex items-center gap-2">
              {isEditingCaption ? (
                <>
                  <Input
                    value={captionValue}
                    onChange={(e) => setCaptionValue(e.target.value)}
                    placeholder="Add a caption..."
                    className="text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      // Allow native browser undo/redo
                      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'y' || e.key === 'Z' || e.key === 'Y')) {
                        // Don't interfere - let browser handle it
                        return;
                      }
                      
                      if (e.key === 'Enter') {
                        onCaptionChange(image.id, captionValue);
                        setIsEditingCaption(false);
                      } else if (e.key === 'Escape') {
                        setCaptionValue(image.caption || "");
                        setIsEditingCaption(false);
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      onCaptionChange(image.id, captionValue);
                      setIsEditingCaption(false);
                    }}
                    className="flex-shrink-0"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditingCaption(true)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-left group/caption"
                >
                  <Edit2 className="w-3 h-3 opacity-0 group-hover/caption:opacity-100 transition-opacity" />
                  <span className="italic">
                    {image.caption || "Add a caption..."}
                  </span>
                </button>
              )}
            </div>
          ) : (
            image.caption && (
              <p className="text-sm text-muted-foreground text-center italic mt-2">
                {image.caption}
              </p>
            )
          )}
        </div>
      )}
    </motion.div>
  );
}

export function FlowDiagramGallery({
  images,
  onImagesChange,
  onImageClick,
  isEditMode = false,
  aspectRatio = '16x9',
  onAspectRatioChange,
  columns = 1,
  onColumnsChange,
}: FlowDiagramGalleryProps) {
  const [dragOver, setDragOver] = useState(false);

  // Get readable label for aspect ratio
  const getAspectRatioLabel = (ratio: AspectRatio): string => {
    switch (ratio) {
      case "3x4":
        return "3:4 (Portrait)";
      case "4x3":
        return "4:3 (Landscape)";
      case "2x3":
        return "2:3 (Tall Portrait)";
      case "3x2":
        return "3:2 (Wide Landscape)";
      case "16x9":
        return "16:9 (Widescreen)";
      default:
        return "16:9 (Widescreen)";
    }
  };

  // Get grid columns class based on column count
  const getGridColumnsClass = (cols: 1 | 2 | 3): string => {
    switch (cols) {
      case 1:
        return "space-y-6";
      case 2:
        return "grid grid-cols-1 md:grid-cols-2 gap-6";
      case 3:
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6";
      default:
        return "space-y-6";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditMode) return;
    const files = Array.from(e.target.files || []);
    addFiles(files);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const addFiles = async (files: File[]) => {
    // Dynamic import to avoid blocking initial load
    const { uploadImage } = await import('../utils/imageHelpers');
    
    for (const file of files) {
      try {
        // Use placeholder URL instead of base64
        const url = await uploadImage(file, 'diagram');
        
        const newImage: FlowDiagramImage = {
          id: Math.random().toString(36).substr(2, 9),
          url: url,
          alt: file.name,
        };
        
        onImagesChange([...images, newImage]);
      } catch (error) {
        console.error('Error adding image:', error);
        alert(`Failed to add image: ${file.name}`);
      }
    }
  };

  const removeImage = (id: string) => {
    if (!isEditMode) return;
    const newImages = images.filter((img) => img.id !== id);
    console.log('🗑️ [FlowDiagramGallery] Removing image:', {
      imageId: id,
      oldCount: images.length,
      newCount: newImages.length,
      removedImageId: id,
      remainingIds: newImages.map(img => img.id),
      timestamp: new Date().toISOString()
    });
    console.log('🗑️ [FlowDiagramGallery] Calling onImagesChange with', newImages.length, 'images');
    onImagesChange(newImages);
    console.log('✅ [FlowDiagramGallery] onImagesChange callback completed');
  };

  const updateCaption = (id: string, caption: string) => {
    if (!isEditMode) return;
    const updatedImages = images.map(img =>
      img.id === id ? { ...img, caption } : img
    );
    onImagesChange(updatedImages);
  };

  const updateImage = (id: string, updates: Partial<FlowDiagramImage>) => {
    if (!isEditMode) return;
    const updatedImages = images.map(img =>
      img.id === id ? { ...img, ...updates } : img
    );
    onImagesChange(updatedImages);
  };

  const moveImageUp = (index: number) => {
    if (index > 0) {
      const updatedImages = [...images];
      const temp = updatedImages[index];
      updatedImages[index] = updatedImages[index - 1];
      updatedImages[index - 1] = temp;
      onImagesChange(updatedImages);
    }
  };

  const moveImageDown = (index: number) => {
    if (index < images.length - 1) {
      const updatedImages = [...images];
      const temp = updatedImages[index];
      updatedImages[index] = updatedImages[index + 1];
      updatedImages[index + 1] = temp;
      onImagesChange(updatedImages);
    }
  };

  return (
    <div className="space-y-6">
      {isEditMode && (
        <div className="space-y-4">
          {/* Gallery Controls Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Aspect Ratio Selector */}
            {onAspectRatioChange && (
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border flex-1">
                <label className="font-medium text-sm whitespace-nowrap">
                  Aspect Ratio:
                </label>
                <Select value={aspectRatio} onValueChange={(value) => onAspectRatioChange(value as AspectRatio)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue>{getAspectRatioLabel(aspectRatio)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3x4">3:4 (Portrait)</SelectItem>
                    <SelectItem value="4x3">4:3 (Landscape)</SelectItem>
                    <SelectItem value="2x3">2:3 (Tall Portrait)</SelectItem>
                    <SelectItem value="3x2">3:2 (Wide Landscape)</SelectItem>
                    <SelectItem value="16x9">16:9 (Widescreen)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Columns Selector */}
            {onColumnsChange && (
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border">
                <label className="font-medium text-sm whitespace-nowrap">
                  Columns:
                </label>
                <Select value={columns.toString()} onValueChange={(value) => onColumnsChange(parseInt(value) as 1 | 2 | 3)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue>{columns} Column{columns > 1 ? 's' : ''}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Column</SelectItem>
                    <SelectItem value="2">2 Columns</SelectItem>
                    <SelectItem value="3">3 Columns</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Image Upload Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">
              Drag and drop images here, or click to select
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Images will display in {getAspectRatioLabel(aspectRatio)}
            </p>
            <label>
              <Button variant="outline" className="cursor-pointer" asChild>
                <span>Choose Files</span>
              </Button>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className={getGridColumnsClass(columns)}>
          {images.map((image, index) => (
            <FlowDiagramItem
              key={image.id}
              image={image}
              index={index}
              isEditMode={isEditMode}
              onRemove={removeImage}
              onImageClick={onImageClick}
              onCaptionChange={updateCaption}
              onImageUpdate={updateImage}
              aspectRatio={aspectRatio}
              totalImages={images.length}
              onMoveUp={() => moveImageUp(index)}
              onMoveDown={() => moveImageDown(index)}
            />
          ))}
        </div>
      )}

      {images.length === 0 && !isEditMode && (
        <div className="relative">
          <div 
            className="aspect-[16/9] overflow-hidden rounded-lg shadow-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center"
          >
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=675&fit=crop&q=80"
              alt="Flow diagram placeholder"
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
              <svg 
                className="w-24 h-24 text-white/80 mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" 
                />
              </svg>
              <p className="text-white text-lg font-semibold">No flow diagrams yet</p>
              <p className="text-white/80 text-sm mt-1">Flow diagrams will appear here</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FlowDiagramGallery;