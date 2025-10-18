import { useState } from "react";
import { motion } from "motion/react";
import { Upload, X } from "lucide-react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface GalleryImage {
  id: string;
  url: string;
  alt: string;
}

export type AspectRatio = "3x4" | "4x3" | "2x3" | "3x2" | "16x9";

interface ImageGalleryProps {
  images: GalleryImage[];
  onImagesChange: (images: GalleryImage[]) => void;
  onImageClick: (image: GalleryImage) => void;
  columns?: number;
  isEditMode?: boolean;
  aspectRatio?: AspectRatio;
  onAspectRatioChange?: (ratio: AspectRatio) => void;
}

export function ImageGallery({
  images,
  onImagesChange,
  onImageClick,
  columns = 3,
  isEditMode = false,
  aspectRatio = "3x4",
  onAspectRatioChange,
}: ImageGalleryProps) {
  const [dragOver, setDragOver] = useState(false);

  // Map aspect ratio to CSS aspect-ratio value
  const getAspectRatioValue = (ratio: AspectRatio): string => {
    switch (ratio) {
      case "3x4":
        return "3 / 4";
      case "4x3":
        return "4 / 3";
      case "2x3":
        return "2 / 3";
      case "3x2":
        return "3 / 2";
      case "16x9":
        return "16 / 9";
      default:
        return "3 / 4";
    }
  };

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
        return "3:4 (Portrait)";
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

  const addFiles = (files: File[]) => {
    const newImages: GalleryImage[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      alt: file.name,
    }));
    onImagesChange([...images, ...newImages]);
  };

  const removeImage = (id: string) => {
    if (!isEditMode) return;
    onImagesChange(images.filter((img) => img.id !== id));
  };

  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }[columns] || "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="space-y-6">
      {isEditMode && (
        <div className="space-y-4">
          {/* Aspect Ratio Selector */}
          {onAspectRatioChange && (
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border">
              <label className="font-medium text-sm whitespace-nowrap">
                Gallery Aspect Ratio:
              </label>
              <Select value={aspectRatio} onValueChange={(value) => onAspectRatioChange(value as AspectRatio)}>
                <SelectTrigger className="w-[220px]">
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
              <span className="text-xs text-muted-foreground">
                All images will use this aspect ratio
              </span>
            </div>
          )}

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
        <div className={`grid ${gridCols} gap-6`}>
          {images.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -8 }}
              className="relative group"
            >
              <div
                onClick={() => onImageClick(image)}
                className="overflow-hidden rounded-lg cursor-pointer bg-muted shadow-lg"
                style={{ aspectRatio: getAspectRatioValue(aspectRatio) }}
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
              </div>
              {isEditMode && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(image.id);
                    }}
                    className="rounded-full p-2 bg-white/95 hover:bg-white text-gray-900 shadow-lg border border-gray-200/50 backdrop-blur-sm dark:bg-gray-900/95 dark:hover:bg-gray-900 dark:text-white dark:border-gray-700/50"
                    aria-label="Remove image"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageGallery;