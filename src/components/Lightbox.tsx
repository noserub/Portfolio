import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, Camera } from "lucide-react";
import { DialogOverlay, DialogPortal } from "./ui/dialog";
import { cn } from "./ui/utils";
import { useEffect, useState } from "react";

interface LightboxImage {
  url: string;
  alt: string;
  caption?: string;
}

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageAlt: string;
  imageCaption?: string;
  images?: LightboxImage[];
  currentIndex?: number;
  onNavigate?: (newIndex: number) => void;
}

export function Lightbox({ 
  isOpen, 
  onClose, 
  imageUrl, 
  imageAlt,
  imageCaption,
  images = [], 
  currentIndex = 0,
  onNavigate 
}: LightboxProps) {
  const hasMultipleImages = images.length > 1;
  const hasPrevious = hasMultipleImages && currentIndex > 0;
  const hasNext = hasMultipleImages && currentIndex < images.length - 1;
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [fullscreenAvailable, setFullscreenAvailable] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialPinchZoom, setInitialPinchZoom] = useState(1);
  const [imageLoadError, setImageLoadError] = useState(false);

  // Check if fullscreen is available
  useEffect(() => {
    const checkFullscreen = () => {
      // Check if fullscreen API is available and not blocked by permissions policy
      const isAvailable = 
        document.fullscreenEnabled !== undefined && 
        document.fullscreenEnabled &&
        typeof document.documentElement.requestFullscreen === 'function';
      setFullscreenAvailable(isAvailable);
    };
    
    checkFullscreen();
  }, []);

  // Reset zoom and pan when image changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setImageLoadError(false); // Reset error state when image changes
  }, [imageUrl]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || !hasMultipleImages || !onNavigate) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && hasPrevious) {
        onNavigate(currentIndex - 1);
      } else if (e.key === "ArrowRight" && hasNext) {
        onNavigate(currentIndex + 1);
      } else if (e.key === "Escape" && isFullscreen) {
        e.preventDefault();
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, hasMultipleImages, onNavigate, currentIndex, hasPrevious, hasNext, isFullscreen]);

  // Fullscreen management
  useEffect(() => {
    if (!isOpen) return;

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isOpen]);

  const toggleFullscreen = async () => {
    if (!fullscreenAvailable) {
      console.warn('Fullscreen API is not available in this context');
      return;
    }
    
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen not available:', err);
      // Silently fail - don't show error to user
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 10));
    // Don't reset pan when zooming
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
    // Don't reset pan when zooming
  };
  
  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 }); // Only reset pan when explicitly resetting
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setHasDragged(false); // Reset drag flag
      // Store the starting mouse position
      setDragStart({ 
        x: e.clientX, 
        y: e.clientY 
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      // Calculate the delta from where we started dragging
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      // Mark as dragged if movement exceeds threshold (3px)
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        setHasDragged(true);
      }
      
      // Update pan position and drag start for smooth continuous dragging
      setPan(prevPan => ({
        x: prevPan.x + deltaX,
        y: prevPan.y + deltaY,
      }));
      
      // Update drag start to current position for next frame
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Helper to calculate distance between two touch points
  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch to zoom - two fingers
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      setInitialPinchDistance(distance);
      setInitialPinchZoom(zoom);
      e.preventDefault();
    } else if (zoom > 1 && e.touches.length === 1) {
      // Pan - one finger when zoomed
      setIsDragging(true);
      setHasDragged(false); // Reset drag flag
      setDragStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });
      e.preventDefault();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance !== null) {
      // Pinch to zoom
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialPinchDistance;
      const newZoom = Math.min(Math.max(initialPinchZoom * scale, 0.5), 10);
      setZoom(newZoom);
      e.preventDefault();
    } else if (isDragging && zoom > 1 && e.touches.length === 1) {
      // Pan when zoomed
      const deltaX = e.touches[0].clientX - dragStart.x;
      const deltaY = e.touches[0].clientY - dragStart.y;
      
      // Mark as dragged if movement exceeds threshold
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        setHasDragged(true);
      }
      
      setPan(prevPan => ({
        x: prevPan.x + deltaX,
        y: prevPan.y + deltaY,
      }));
      
      setDragStart({ 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setInitialPinchDistance(null);
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 w-full max-w-7xl translate-x-[-50%] translate-y-[-50%] p-0 border-none rounded-lg shadow-lg duration-200"
          )}
          style={{
            background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 25%, #3b82f6 50%, #06b6d4 75%, #fbbf24 100%)'
          }}
        >
          <DialogPrimitive.Title className="sr-only">{imageAlt}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Full size image preview
          </DialogPrimitive.Description>
          
          {/* Control Bar - Top */}
          <div className="absolute top-4 left-0 right-0 z-50 flex items-center justify-between px-4">
            {/* Zoom Controls - Left */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 backdrop-blur-sm shadow-2xl ring-2 ring-white/20 ${imageLoadError ? 'opacity-50' : ''}`}>
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 0.5 || imageLoadError}
                className="p-1.5 text-white hover:bg-white/20 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label={imageLoadError ? "Zoom unavailable for placeholder" : "Zoom out"}
                title={imageLoadError ? "Zoom unavailable for placeholder images" : "Zoom out"}
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className="text-white text-sm font-medium min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 10 || imageLoadError}
                className="p-1.5 text-white hover:bg-white/20 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label={imageLoadError ? "Zoom unavailable for placeholder" : "Zoom in"}
                title={imageLoadError ? "Zoom unavailable for placeholder images" : "Zoom in"}
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={handleZoomReset}
                disabled={imageLoadError}
                className="p-1.5 text-white hover:bg-white/20 rounded-full transition-all ml-1 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label={imageLoadError ? "Zoom unavailable for placeholder" : "Reset zoom"}
                title={imageLoadError ? "Zoom unavailable for placeholder images" : "Reset zoom"}
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            {/* Image Counter - Center */}
            <div className="flex items-center gap-3">
              {hasMultipleImages && (
                <div className="px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm font-medium shadow-2xl ring-2 ring-white/20">
                  {currentIndex + 1} / {images.length}
                </div>
              )}
              {zoom > 1 && !imageLoadError && (
                <div className="px-3 py-1.5 rounded-full bg-blue-500/50 backdrop-blur-sm text-white text-xs font-medium shadow-2xl ring-2 ring-blue-400/30 flex items-center gap-1.5">
                  <span>🖐️</span>
                  <span>Drag to pan</span>
                </div>
              )}
              {imageLoadError && (
                <div className="px-4 py-2 rounded-full bg-amber-500/50 backdrop-blur-sm text-white text-xs font-medium shadow-2xl ring-2 ring-amber-400/30 flex items-center gap-1.5">
                  <Camera className="w-4 h-4" />
                  <span>Placeholder Image</span>
                </div>
              )}
            </div>

            {/* Fullscreen & Close - Right */}
            <div className="flex items-center gap-2">
              {fullscreenAvailable && (
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 hover:scale-110 transition-all duration-200 shadow-2xl ring-2 ring-white/20 hover:ring-white/40"
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 hover:scale-110 transition-all duration-200 shadow-2xl ring-2 ring-white/20 hover:ring-white/40"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <div className="flex flex-col">
            <div 
              className="flex items-center justify-center p-6 min-h-[80vh] relative overflow-hidden"
              onMouseMove={imageLoadError ? undefined : handleMouseMove}
              onMouseUp={imageLoadError ? undefined : handleMouseUp}
              onMouseLeave={imageLoadError ? undefined : handleMouseUp}
              onTouchMove={imageLoadError ? undefined : handleTouchMove}
              onTouchEnd={imageLoadError ? undefined : handleTouchEnd}
              style={{ cursor: imageLoadError ? 'default' : (zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default') }}
            >
              {/* Previous Button */}
              {hasPrevious && onNavigate && (
                <button
                  onClick={() => onNavigate(currentIndex - 1)}
                  className="absolute left-4 z-50 p-3 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 hover:scale-110 transition-all duration-200 shadow-2xl ring-2 ring-white/20 hover:ring-white/40"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
              )}
              
              <img
                src={imageUrl}
                alt=""
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                  maxWidth: '100%',
                  maxHeight: imageCaption ? '75vh' : '85vh',
                  objectFit: 'contain',
                  userSelect: 'none',
                  transformOrigin: 'center center',
                  opacity: imageLoadError ? 0 : 1,
                }}
                className={`drop-shadow-2xl ${imageLoadError ? 'cursor-default' : (zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in')}`}
                onClick={(e) => {
                  // Only zoom in if it was a click (not a drag), we can zoom more, and image loaded successfully
                  if (zoom < 10 && !hasDragged && !imageLoadError) {
                    handleZoomIn();
                    e.stopPropagation();
                  }
                }}
                onMouseDown={imageLoadError ? undefined : handleMouseDown}
                onTouchStart={imageLoadError ? undefined : handleTouchStart}
                onLoad={() => setImageLoadError(false)}
                onError={() => setImageLoadError(true)}
                draggable={false}
              />
              
              {/* Placeholder icon when image fails to load */}
              {imageLoadError && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Camera 
                    className="text-white/60" 
                    style={{ 
                      width: '80px', 
                      height: '80px',
                      strokeWidth: 1.5
                    }} 
                  />
                </div>
              )}
              
              {/* Next Button */}
              {hasNext && onNavigate && (
                <button
                  onClick={() => onNavigate(currentIndex + 1)}
                  className="absolute right-4 z-50 p-3 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 hover:scale-110 transition-all duration-200 shadow-2xl ring-2 ring-white/20 hover:ring-white/40"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              )}
            </div>

            {/* Caption - Below Image (hidden for placeholders) */}
            {imageCaption && !imageLoadError && (
              <div className="px-6 pb-6 pt-4 flex justify-center">
                <div className="px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm font-medium shadow-2xl ring-2 ring-white/20 max-w-3xl">
                  <p className="text-center italic leading-relaxed">
                    {imageCaption}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}

export default Lightbox;