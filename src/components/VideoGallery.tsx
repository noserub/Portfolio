import { useState } from "react";
import { motion } from "motion/react";
import { Upload, X, Edit2, Link as LinkIcon, Play, ArrowUp, ArrowDown, Video as VideoIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";

interface VideoItem {
  id: string;
  url: string;
  type: 'youtube' | 'vimeo' | 'upload' | 'url';
  caption?: string;
  thumbnail?: string;
}

export type AspectRatio = "3x4" | "4x3" | "2x3" | "3x2" | "16x9" | "9x16";

interface VideoGalleryProps {
  videos: VideoItem[];
  onVideosChange: (videos: VideoItem[]) => void;
  isEditMode?: boolean;
  aspectRatio?: AspectRatio;
  onAspectRatioChange?: (ratio: AspectRatio) => void;
  columns?: 1 | 2 | 3;
  onColumnsChange?: (columns: 1 | 2 | 3) => void;
}

interface VideoItemProps {
  video: VideoItem;
  index: number;
  isEditMode: boolean;
  onRemove: (id: string) => void;
  onCaptionChange: (id: string, caption: string) => void;
  aspectRatio: AspectRatio;
  totalVideos: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

// Helper function to extract video ID from YouTube URL
function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Helper function to extract video ID from Vimeo URL
function getVimeoId(url: string): string | null {
  const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

// Helper function to determine video type from URL
function detectVideoType(url: string): 'youtube' | 'vimeo' | 'url' {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  } else if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  return 'url';
}

function VideoItemComponent({
  video,
  index,
  isEditMode,
  onRemove,
  onCaptionChange,
  aspectRatio,
  totalVideos,
  onMoveUp,
  onMoveDown,
}: VideoItemProps) {
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionValue, setCaptionValue] = useState(video.caption || "");

  // Get the embed URL based on video type
  const getEmbedUrl = () => {
    if (video.type === 'youtube') {
      const videoId = getYouTubeId(video.url);
      return videoId ? `https://www.youtube.com/embed/${videoId}` : video.url;
    } else if (video.type === 'vimeo') {
      const videoId = getVimeoId(video.url);
      return videoId ? `https://player.vimeo.com/video/${videoId}` : video.url;
    }
    return video.url;
  };

  // Get thumbnail URL
  const getThumbnailUrl = () => {
    if (video.thumbnail) return video.thumbnail;
    
    if (video.type === 'youtube') {
      const videoId = getYouTubeId(video.url);
      return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : undefined;
    } else if (video.type === 'vimeo') {
      // Vimeo requires an API call for thumbnails, so we'll use a placeholder
      return undefined;
    }
    return undefined;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative group"
    >
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        className="overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all relative"
        style={{
          aspectRatio: aspectRatio === '3x4' ? '3 / 4' :
                      aspectRatio === '4x3' ? '4 / 3' :
                      aspectRatio === '2x3' ? '2 / 3' :
                      aspectRatio === '3x2' ? '3 / 2' :
                      aspectRatio === '9x16' ? '9 / 16' :
                      '16 / 9',
          background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 25%, #3b82f6 50%, #06b6d4 75%, #fbbf24 100%)',
        }}
      >
        {video.type === 'upload' ? (
          <video
            src={video.url}
            controls
            className="w-full h-full object-cover"
            style={{ objectFit: 'cover' }}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <iframe
            src={getEmbedUrl()}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={video.caption || `Video ${index + 1}`}
          />
        )}
      </motion.div>
      
      {isEditMode && (
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
                className="rounded-full p-2 bg-background/80 backdrop-blur-sm"
                aria-label="Move video up"
                title="Move video up"
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
            )}
            
            {/* Move Down Button */}
            {index < totalVideos - 1 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown?.();
                }}
                className="rounded-full p-2 bg-background/80 backdrop-blur-sm"
                aria-label="Move video down"
                title="Move video down"
              >
                <ArrowDown className="w-4 h-4" />
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(video.id);
              }}
              className="rounded-full p-2 bg-background/80 backdrop-blur-sm"
              aria-label="Remove video"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
      
      {/* Caption */}
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
                    if (e.key === 'Enter') {
                      onCaptionChange(video.id, captionValue);
                      setIsEditingCaption(false);
                    } else if (e.key === 'Escape') {
                      setCaptionValue(video.caption || "");
                      setIsEditingCaption(false);
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    onCaptionChange(video.id, captionValue);
                    setIsEditingCaption(false);
                  }}
                  className="flex-shrink-0"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <button
                onClick={() => setIsEditingCaption(true)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-left group/caption"
              >
                <Edit2 className="w-3 h-3 opacity-0 group-hover/caption:opacity-100 transition-opacity" />
                <span className="italic">
                  {video.caption || "Add a caption..."}
                </span>
              </button>
            )}
          </div>
        ) : (
          video.caption && (
            <p className="text-sm text-muted-foreground text-center italic mt-2">
              {video.caption}
            </p>
          )
        )}
      </div>
    </motion.div>
  );
}

export function VideoGallery({
  videos,
  onVideosChange,
  isEditMode = false,
  aspectRatio = '16x9',
  onAspectRatioChange,
  columns = 1,
  onColumnsChange,
}: VideoGalleryProps) {
  const [dragOver, setDragOver] = useState(false);
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

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
      case "9x16":
        return "9:16 (Vertical)";
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
        // Use placeholder URL for videos (videos are typically larger, so we store them as placeholders)
        const url = await uploadImage(file, 'video');
        
        const newVideo: VideoItem = {
          id: Math.random().toString(36).substr(2, 9),
          url: url,
          type: 'upload',
        };
        
        onVideosChange([...videos, newVideo]);
      } catch (error) {
        console.error('Error adding video:', error);
        alert(`Failed to add video: ${file.name}`);
      }
    }
  };

  const addVideoUrl = () => {
    if (!videoUrl.trim()) return;
    
    const type = detectVideoType(videoUrl);
    const newVideo: VideoItem = {
      id: Math.random().toString(36).substr(2, 9),
      url: videoUrl,
      type: type,
    };
    
    onVideosChange([...videos, newVideo]);
    setVideoUrl("");
    setIsAddingVideo(false);
  };

  const removeVideo = (id: string) => {
    if (!isEditMode) return;
    const newVideos = videos.filter((vid) => vid.id !== id);
    onVideosChange(newVideos);
  };

  const updateCaption = (id: string, caption: string) => {
    if (!isEditMode) return;
    const updatedVideos = videos.map(vid =>
      vid.id === id ? { ...vid, caption } : vid
    );
    onVideosChange(updatedVideos);
  };

  const moveVideoUp = (index: number) => {
    if (index > 0) {
      const updatedVideos = [...videos];
      const temp = updatedVideos[index];
      updatedVideos[index] = updatedVideos[index - 1];
      updatedVideos[index - 1] = temp;
      onVideosChange(updatedVideos);
    }
  };

  const moveVideoDown = (index: number) => {
    if (index < videos.length - 1) {
      const updatedVideos = [...videos];
      const temp = updatedVideos[index];
      updatedVideos[index] = updatedVideos[index + 1];
      updatedVideos[index + 1] = temp;
      onVideosChange(updatedVideos);
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
                    <SelectItem value="9x16">9:16 (Vertical)</SelectItem>
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

          {/* Video Upload/Add Area */}
          <div className="space-y-4">
            {/* Add Video URL Button */}
            <Dialog open={isAddingVideo} onOpenChange={setIsAddingVideo}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full" size="lg">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Add Video URL (YouTube, Vimeo, or direct link)
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Video URL</DialogTitle>
                  <DialogDescription>
                    Enter a YouTube, Vimeo, or direct video link to add to your gallery
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="video-url">Video URL</Label>
                    <Input
                      id="video-url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addVideoUrl();
                        }
                      }}
                    />
                    <p className="text-sm text-muted-foreground">
                      Supports YouTube, Vimeo, and direct video links
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddingVideo(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addVideoUrl}>
                      Add Video
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* File Upload Area */}
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
                Drag and drop video files here, or click to select
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Videos will display in {getAspectRatioLabel(aspectRatio)}
              </p>
              <label className="inline-block">
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button type="button" variant="outline" className="cursor-pointer">
                  Choose Video Files
                </Button>
              </label>
            </div>
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div className={getGridColumnsClass(columns)}>
          {videos.map((video, index) => (
            <VideoItemComponent
              key={video.id}
              video={video}
              index={index}
              isEditMode={isEditMode}
              onRemove={removeVideo}
              onCaptionChange={updateCaption}
              aspectRatio={aspectRatio}
              totalVideos={videos.length}
              onMoveUp={() => moveVideoUp(index)}
              onMoveDown={() => moveVideoDown(index)}
            />
          ))}
        </div>
      )}

      {videos.length === 0 && !isEditMode && (
        <div className="relative">
          <div 
            className="aspect-[16/9] overflow-hidden rounded-lg shadow-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center"
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
              <VideoIcon className="w-24 h-24 text-white/60 mb-4" strokeWidth={1.5} />
              <p className="text-white text-lg font-semibold">No videos yet</p>
              <p className="text-white/80 text-sm mt-1">Videos will appear here</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoGallery;
