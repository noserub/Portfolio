import React from "react";
import { motion } from "motion/react";
import { useState, useEffect, useRef, memo, useMemo, useCallback } from "react";
import { Edit2, Move, Check, X, ZoomIn, ZoomOut, RotateCcw, Lock, Eye, Trash2, MoreVertical, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
// Import optimized image components
import OptimizedImage from './OptimizedImage';

export interface ProjectData {
  id: string;
  url: string;
  title: string;
  description: string;
  position: { x: number; y: number };
  scale: number;
  published: boolean;
  requiresPassword?: boolean;
  caseStudyContent?: string;
  caseStudyImages?: Array<{ 
    id: string; 
    url: string; 
    alt: string;
    scale?: number;
    position?: { x: number; y: number };
  }>;
  flowDiagramImages?: Array<{
    id: string;
    url: string;
    alt: string;
    caption?: string;
    scale?: number;
    position?: { x: number; y: number };
  }>;
  videoItems?: Array<{
    id: string;
    url: string;
    type: 'youtube' | 'vimeo' | 'upload' | 'url';
    caption?: string;
    thumbnail?: string;
  }>;
  galleryAspectRatio?: "3x4" | "4x3" | "2x3" | "3x2" | "16x9";
  flowDiagramAspectRatio?: "3x4" | "4x3" | "2x3" | "3x2" | "16x9";
  videoAspectRatio?: "3x4" | "4x3" | "2x3" | "3x2" | "16x9" | "9x16";
  galleryColumns?: 1 | 2 | 3;
  flowDiagramColumns?: 1 | 2 | 3;
  videoColumns?: 1 | 2 | 3;
  projectImagesPosition?: number; // Index position in sections array (default: after Overview)
  videosPosition?: number; // Index position in sections array (default: before Flow Diagrams)
  flowDiagramsPosition?: number;  // Index position in sections array (default: after Videos)
  solutionCardsPosition?: number; // Index position in sections array (default: after Flow Diagrams)
  sectionPositions?: Record<string, number>; // Position tracking for ALL sections (markdown + special)
}

interface ProjectImageProps {
  project: ProjectData;
  onClick: () => void;
  isEditMode: boolean;
  onUpdate: (updatedProject: ProjectData, skipRefetch?: boolean) => void;
  onReplace: (file: File) => void;
  onNavigate?: () => void;
  onDelete?: () => void;
}

export function ProjectImage({
  project,
  onClick,
  isEditMode,
  onUpdate,
  onReplace,
  onNavigate,
  onDelete,
}: ProjectImageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [editedProject, setEditedProject] = useState(project);
  const [isPositioning, setIsPositioning] = useState(false);
  const [isDraggingPosition, setIsDraggingPosition] = useState(false);
  const isDraggingRef = useRef(false);
  const dragPositionRef = useRef({ x: 0, y: 0 });
  const lastUpdateTimeRef = useRef(0);
  const [imageLoadError, setImageLoadError] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Sync local state when project prop changes (e.g., when image is replaced)
  // But only update if the project ID changes or if we're not currently editing
  useEffect(() => {
    // Only reset if the project ID actually changed (new project) or if we're not editing
    if (project.id !== editedProject.id || !isEditing) {
    setEditedProject(project);
    setImageLoadError(false); // Reset error state when project changes
    }
  }, [project.id, project.url, project.title, project.description]); // Only depend on specific fields, not the entire project object

  // Handle image load error
  const handleImageError = () => {
    console.log('❌ Image failed to load:', editedProject.url);
    setImageLoadError(true);
  };

  // Handle escape key to exit positioning mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPositioning) {
        console.log('⌨️ Escape key pressed - exiting positioning mode');
        setIsPositioning(false);
      }
    };

    if (isPositioning) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isPositioning]);

  // Get the image URL with fallback
  const getImageUrl = () => {
    if (imageLoadError) {
      // Use a fallback image when the main image fails to load
      return 'https://images.unsplash.com/photo-1551650975-87deedd944c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5fGVufDF8fHx8MTc1OTM3NTg3Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral';
    }
    return editedProject.url;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onReplace(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      onReplace(file);
    }
  };

  const handleSave = () => {
    onUpdate(editedProject);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProject(project);
    setIsEditing(false);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't handle clicks when positioning - let the drag handlers do it
    if (isEditMode && isPositioning) {
      return;
    }
    
    // In edit mode but not positioning, do nothing
    if (isEditMode) {
      return;
    }

    // In preview mode, always open lightbox
    onClick();
  };

  const handleTogglePublish = () => {
    const updated = { ...editedProject, published: !editedProject.published };
    setEditedProject(updated);
    onUpdate(updated);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isPositioning) return;
    e.stopPropagation();
    e.preventDefault();
    console.log('🖱️ Mouse down in positioning mode');
    setIsDraggingPosition(true);
    isDraggingRef.current = true;
    
    // Initialize drag position ref with pixel-based precision
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const x = Math.max(0, Math.min(100, (mouseX / rect.width) * 100));
    const y = Math.max(0, Math.min(100, (mouseY / rect.height) * 100));
    
    dragPositionRef.current = { x, y };
    
    console.log('📍 Initializing drag position:', { x, y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingPosition) return;
    e.stopPropagation();
    e.preventDefault();
    
    const now = Date.now();
    // Throttle updates to 60fps for smooth performance
    if (now - lastUpdateTimeRef.current < 16) return;
    lastUpdateTimeRef.current = now;
    
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Use pixel-based positioning for much finer control
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Convert to percentage with much higher precision
    const x = Math.max(0, Math.min(100, (mouseX / rect.width) * 100));
    const y = Math.max(0, Math.min(100, (mouseY / rect.height) * 100));
    
    // Store position in ref to avoid re-renders during drag
    dragPositionRef.current = { x, y };
    
    // Update the image transform directly for real-time preview
    const imageElement = imageRef.current?.querySelector('img');
    if (imageElement) {
      imageElement.style.transformOrigin = `${x}% ${y}%`;
      imageElement.style.transform = `scale(${editedProject.scale})`;
    }
    
    // Add visual feedback - show crosshair at drag position
    const crosshair = imageRef.current?.querySelector('.drag-crosshair');
    if (crosshair) {
      crosshair.style.left = `${x}%`;
      crosshair.style.top = `${y}%`;
    }
  };

  const handleMouseUp = () => {
    if (isDraggingPosition) {
      setIsDraggingPosition(false);
      isDraggingRef.current = false;
      
      // Apply the final position from the ref to the state
      const finalPosition = dragPositionRef.current;
      const updated = {
        ...editedProject,
        position: finalPosition,
      };
      setEditedProject(updated);
      
      // Auto-save when done dragging - skip refetch for position updates
      onUpdate(updated, true);
    }
  };

  const handleScaleChange = (newScale: number) => {
    const updated = {
      ...editedProject,
      scale: newScale,
    };
    setEditedProject(updated);
    onUpdate(updated);
  };

  const handleReset = () => {
    const updated = {
      ...editedProject,
      scale: 1,
      position: { x: 50, y: 50 },
    };
    setEditedProject(updated);
    onUpdate(updated);
  };

  // New functions for improved UX
  const handleFitToFrame = () => {
    // Reset to default centered position with optimal scale
    const updated = {
      ...editedProject,
      scale: 1.0, // Reset to 1:1 scale
      position: { x: 50, y: 50 } // Center the image perfectly
    };
    console.log('🎯 Fitting image to frame');
    setEditedProject(updated);
    // Skip refetch for minor position updates to prevent card refresh
    onUpdate(updated, true);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(0.3, editedProject.scale - 0.1); // Smaller increments for precision
    const updated = {
      ...editedProject,
      scale: newScale
    };
    console.log('🔍 Zoom Out:', { oldScale: editedProject.scale, newScale });
    setEditedProject(updated);
    // Skip refetch for minor zoom updates to prevent card refresh
    onUpdate(updated, true);
  };

  const handleZoomIn = () => {
    const newScale = Math.min(2.0, editedProject.scale + 0.1); // Allow up to 200% zoom
    const updated = {
      ...editedProject,
      scale: newScale
    };
    console.log('🔍 Zoom In:', { oldScale: editedProject.scale, newScale });
    setEditedProject(updated);
    // Skip refetch for minor zoom updates to prevent card refresh
    onUpdate(updated, true);
  };

  const handleResetImage = () => {
    const updated = {
      ...editedProject,
      scale: 1,
      position: { x: 50, y: 50 }
    };
    console.log('🔄 Resetting image to default scale and position');
    setEditedProject(updated);
    onUpdate(updated);
  };

  // Fallback functions for optional props
  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate();
    } else {
      // Fallback to onClick if onNavigate not provided
      onClick();
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    } else {
      // Fallback - could show a confirmation dialog
      console.log('Delete function not provided');
    }
  };

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group px-2"
      onDragOver={(e) => {
        if (isEditMode) {
          e.preventDefault();
          setIsDragging(true);
        }
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <motion.div
        whileHover={!isEditMode && !isDraggingRef.current ? { 
          scale: 1.05,
          rotate: isHovered ? [0, -2, 2, -2, 0] : 0,
        } : {}}
        transition={!isEditMode && !isDraggingRef.current ? {
          scale: { duration: 0.2 },
          rotate: { duration: 0.5, ease: "easeInOut" }
        } : undefined}
        onClick={handleImageClick}
        className={`relative ${!isEditMode ? "cursor-pointer" : ""} ${isPositioning ? "ring-4 ring-yellow-400" : ""}`}
      >
        <div
          ref={imageRef}
          className={`aspect-[3/4] w-[280px] overflow-hidden shadow-xl ${
            !isEditMode && !isDraggingRef.current ? "transition-all duration-200" : "no-transitions"
          } ${
            isDragging ? "ring-4 ring-primary" : ""
          } ${!isEditMode && isHovered ? "shadow-2xl ring-2 ring-primary/30" : ""}`}
          style={{
            background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 25%, #3b82f6 50%, #06b6d4 75%, #fbbf24 100%)',
            cursor: isPositioning ? 'crosshair' : !isEditMode ? 'pointer' : 'default',
            borderRadius: '1rem 1rem 2rem 2rem'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Hidden image to detect load errors */}
          <img
            src={editedProject.url}
            alt=""
            style={{ display: 'none' }}
            onError={handleImageError}
            onLoad={() => setImageLoadError(false)}
          />
          
          <motion.div
            className="w-full h-full relative"
            style={{
              borderRadius: '1rem 1rem 2rem 2rem',
              overflow: 'hidden' // Keep overflow hidden for rounded corners
            }}
            animate={!isEditMode && !isDraggingRef.current ? {
              scale: isHovered ? 1.08 : 1,
            } : {}}
            transition={!isEditMode && !isDraggingRef.current ? {
              duration: 0.3,
              ease: "easeOut",
            } : undefined}
          >
            <div 
              className="w-full h-full overflow-hidden"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <OptimizedImage
                src={getImageUrl()}
                alt={editedProject.title}
                className="w-full h-full"
                style={{
                  objectFit: 'cover',
                  transform: `scale(${editedProject.scale})`,
                  transformOrigin: `${editedProject.position.x}% ${editedProject.position.y}%`,
                  cursor: isPositioning ? 'crosshair' : 'default',
                  padding: editedProject.scale > 1.0 ? '10px' : '0px'
                }}
                quality={85}
                fit="cover"
                onLoad={() => setImageLoadError(false)}
                onError={handleImageError}
                priority={false}
                lazy={true}
              />
              
              {/* Drag crosshair indicator */}
              {isPositioning && (
                <div 
                  className="drag-crosshair absolute pointer-events-none z-10"
                  style={{
                    left: `${editedProject.position.x}%`,
                    top: `${editedProject.position.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '20px',
                    height: '20px',
                    border: '2px solid #3b82f6',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                  }}
                />
              )}
            </div>
            
            
          {/* Status indicator */}
            {/* Project description badge */}
            {!isEditMode && (
              <div className="absolute bottom-4 left-4 right-4 z-20">
                <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-medium" style={{ borderRadius: '8px' }}>
                  {project.description}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Fun sparkle effect on hover - moved outside background container */}
        {!isEditMode && isHovered && (
          <>
            <motion.div
              className="absolute top-4 right-4 w-3 h-3 bg-yellow-300 rounded-full z-30"
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatDelay: 0.3,
              }}
            />
            <motion.div
              className="absolute top-6 right-8 w-2 h-2 bg-pink-300 rounded-full z-30"
              animate={{
                scale: [0, 1.3, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatDelay: 0.5,
                delay: 0.2,
              }}
            />
            <motion.div
              className="absolute top-8 right-6 w-2 h-2 bg-blue-300 rounded-full z-30"
              animate={{
                scale: [0, 1.2, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatDelay: 0.4,
                delay: 0.4,
              }}
            />
          </>
        )}

        {/* Lock Badge for Password-Protected Projects (Preview Mode) */}
        {!isEditMode && project.requiresPassword && (
          <div className="absolute top-3 left-3 z-10">
            <div className="bg-purple-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">Password</span>
            </div>
          </div>
        )}



        {/* Enhanced Hover State */}
        {!isEditMode && isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-20"
            style={{
              borderRadius: '1rem 1rem 2rem 2rem',
              overflow: 'hidden',
              clipPath: 'inset(0 round 1rem 1rem 2rem 2rem)'
            }}
          >
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05, duration: 0.2 }}
              className="text-white text-center px-4"
            >
              <p className="text-lg font-semibold mb-1">Show project</p>
              <p className="text-sm opacity-90">Click to see full details</p>
            </motion.div>
          </motion.div>
        )}

        {/* Clean Edit Mode Controls with UX Best Practices */}
        {isEditMode && (
          <>
            {/* Top Bar - Primary Actions */}
            <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-20">
              {/* Status Badge */}
            <Button
              size="sm"
              variant={project.published ? "default" : "secondary"}
              onClick={handleTogglePublish}
              className="shadow-lg"
            >
              {project.published ? "Published" : "Draft"}
            </Button>
              
              {/* Primary Actions - Edit & View */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsEditing(!isEditing)}
                  className="shadow-lg"
                  title="Edit project details"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleNavigate}
                  className="shadow-lg"
                  title="Edit project details"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                
                {/* Overflow Menu for Secondary Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="shadow-lg"
                      title="More actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Project
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleFitToFrame}>
                      <ZoomIn className="w-4 h-4 mr-2" />
                      Fit to Frame
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleResetImage}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset Image
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Bottom Bar - Image Controls - Inside Card Frame */}
            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center z-20" style={{
              padding: '0.5rem 0.75rem'
            }}>
              {/* Image Controls */}
              <div className="flex gap-2">
            {isPositioning && (
              <Button
                size="sm"
                variant="default"
                className="shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPositioning(false);
                }}
                title="Done positioning"
              >
                <Check className="w-4 h-4 mr-1" />
                Done
              </Button>
            )}
            <Button
              size="sm"
              variant={isPositioning ? "default" : "secondary"}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPositioning(!isPositioning);
                  }}
              className="shadow-lg"
                  title="Drag to position image"
            >
              <Move className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
                  onClick={handleZoomIn}
                  className="shadow-lg"
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleZoomOut}
              className="shadow-lg"
                  title="Zoom out"
            >
                  <ZoomOut className="w-4 h-4" />
            </Button>
          </div>
              
              {/* Scale Indicator */}
              <div className="bg-black/90 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                {(editedProject.scale * 100).toFixed(0)}%
              </div>
            </div>
          </>
        )}

        {/* Edit Dialog */}
        {isEditMode && isEditing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-background/95 backdrop-blur-sm shadow-2xl z-30 flex flex-col rounded-b-[2rem]"
            style={{
              overflow: 'hidden'
            }}
          >
            {/* Header - Fixed */}
            <div className="flex justify-between items-start p-6 pb-4 border-b border-border">
              <h4 className="text-lg font-semibold">Edit Project</h4>
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium">Title</label>
                <Input
                  value={editedProject.title}
                  onChange={(e) =>
                    setEditedProject({ ...editedProject, title: e.target.value })
                  }
                  placeholder="Project title"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Description</label>
                <Textarea
                  value={editedProject.description}
                  onChange={(e) =>
                    setEditedProject({ ...editedProject, description: e.target.value })
                  }
                  placeholder="Project description"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <Checkbox
                  id={`password-${project.id}`}
                  checked={editedProject.requiresPassword || false}
                  onCheckedChange={(checked) =>
                    setEditedProject({ 
                      ...editedProject, 
                      requiresPassword: checked as boolean 
                    })
                  }
                />
                <div className="flex-1">
                  <label
                    htmlFor={`password-${project.id}`}
                    className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Require password to view
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Viewers will need to enter a password before accessing this case study
                  </p>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Image Scale</label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={editedProject.scale}
                  onChange={(e) =>
                    setEditedProject({
                      ...editedProject,
                      scale: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Replace Image</label>
                <label className="cursor-pointer">
                  <Button variant="outline" className="w-full" asChild>
                    <span>Choose New Image</span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className="p-6 pt-4 border-t border-border bg-background/50">
            <Button onClick={handleSave} className="w-full">
              <Check className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            </div>
          </motion.div>
        )}

      </motion.div>
    </motion.div>
  );
}

// Memoized component to prevent unnecessary re-renders
const MemoizedProjectImage = memo(ProjectImage, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.project.id === nextProps.project.id &&
    prevProps.project.title === nextProps.project.title &&
    prevProps.project.description === nextProps.project.description &&
    prevProps.project.url === nextProps.project.url &&
    prevProps.project.published === nextProps.project.published &&
    prevProps.project.requiresPassword === nextProps.project.requiresPassword &&
    prevProps.project.position?.x === nextProps.project.position?.x &&
    prevProps.project.position?.y === nextProps.project.position?.y &&
    prevProps.project.scale === nextProps.project.scale &&
    prevProps.isEditMode === nextProps.isEditMode &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.isOver === nextProps.isOver
  );
});

MemoizedProjectImage.displayName = 'ProjectImage';

export default MemoizedProjectImage;