import { motion } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { Edit2, Move, Check, X, ZoomIn, ZoomOut, RotateCcw, Lock } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";

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
  onUpdate: (updatedProject: ProjectData) => void;
  onReplace: (file: File) => void;
}

export function ProjectImage({
  project,
  onClick,
  isEditMode,
  onUpdate,
  onReplace,
}: ProjectImageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [editedProject, setEditedProject] = useState(project);
  const [isPositioning, setIsPositioning] = useState(false);
  const [isDraggingPosition, setIsDraggingPosition] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Sync local state when project prop changes (e.g., when image is replaced)
  useEffect(() => {
    setEditedProject(project);
    setImageLoadError(false); // Reset error state when project changes
  }, [project]);

  // Handle image load error
  const handleImageError = () => {
    console.log('❌ Image failed to load:', editedProject.url);
    setImageLoadError(true);
  };

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
    setIsDraggingPosition(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingPosition || !imageRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    
    setEditedProject({
      ...editedProject,
      position: { x, y },
    });
  };

  const handleMouseUp = () => {
    if (isDraggingPosition) {
      setIsDraggingPosition(false);
      // Auto-save when done dragging
      onUpdate(editedProject);
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
        whileHover={!isEditMode ? { 
          scale: 1.05,
          rotate: isHovered ? [0, -2, 2, -2, 0] : 0,
        } : {}}
        transition={{
          scale: { duration: 0.2 },
          rotate: { duration: 0.5, ease: "easeInOut" }
        }}
        onClick={handleImageClick}
        className={`relative ${!isEditMode ? "cursor-pointer" : ""} ${isPositioning ? "ring-4 ring-yellow-400" : ""}`}
      >
        <div
          ref={imageRef}
          className={`aspect-[3/4] w-[280px] overflow-hidden rounded-2xl shadow-xl transition-all duration-200 ${
            isDragging ? "ring-4 ring-primary" : ""
          } ${!isEditMode && isHovered ? "shadow-2xl ring-2 ring-primary/30" : ""}`}
          style={{
            background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 25%, #3b82f6 50%, #06b6d4 75%, #fbbf24 100%)',
            cursor: isPositioning ? 'crosshair' : !isEditMode ? 'pointer' : 'default'
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
              backgroundImage: `url(${getImageUrl()})`,
              backgroundSize: `${editedProject.scale * 100}%`,
              backgroundPosition: `${editedProject.position.x}% ${editedProject.position.y}%`,
              backgroundRepeat: "no-repeat",
            }}
            animate={{
              scale: !isEditMode && isHovered ? 1.08 : 1,
            }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
          >
            {/* Click hint overlay */}
            {!isEditMode && isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-none"
              >
                <div className="text-white text-center px-4">
                  <p className="text-lg font-semibold mb-1">View Case Study</p>
                  <p className="text-sm opacity-90">Click to see full details</p>
                </div>
              </motion.div>
            )}

            {/* Fun sparkle effect on hover */}
            {!isEditMode && isHovered && (
              <>
                <motion.div
                  className="absolute top-4 right-4 w-3 h-3 bg-yellow-300 rounded-full z-10"
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
                  className="absolute top-6 right-8 w-2 h-2 bg-pink-300 rounded-full"
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
                  className="absolute top-8 right-6 w-2 h-2 bg-blue-300 rounded-full"
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
          </motion.div>
        </div>

        {/* Lock Badge for Password-Protected Projects (Preview Mode) */}
        {!isEditMode && project.requiresPassword && (
          <div className="absolute top-3 left-3 z-10">
            <div className="bg-purple-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">Password</span>
            </div>
          </div>
        )}

        {/* Viewer Hover State */}
        {!isEditMode && isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent rounded-2xl flex flex-col justify-end p-5"
          >
            <motion.h3 
              className="text-white mb-1.5 text-lg"
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05, duration: 0.2 }}
            >
              {project.title}
            </motion.h3>
            <motion.p 
              className="text-white/85 text-sm"
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
            >
              {project.description}
            </motion.p>
          </motion.div>
        )}

        {/* Edit Mode Controls */}
        {isEditMode && (
          <div className="absolute top-3 right-3 flex gap-2">
            <Button
              size="sm"
              variant={project.published ? "default" : "secondary"}
              onClick={handleTogglePublish}
              className="shadow-lg"
            >
              {project.published ? "Published" : "Draft"}
            </Button>
            <Button
              size="sm"
              variant={isPositioning ? "default" : "secondary"}
              onClick={() => setIsPositioning(!isPositioning)}
              className="shadow-lg"
            >
              <Move className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsEditing(!isEditing)}
              className="shadow-lg"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Edit Dialog */}
        {isEditMode && isEditing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-background/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl z-10 flex flex-col gap-4"
          >
            <div className="flex justify-between items-start">
              <h4>Edit Project</h4>
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              <div>
                <label className="block mb-1 text-sm">Title</label>
                <Input
                  value={editedProject.title}
                  onChange={(e) =>
                    setEditedProject({ ...editedProject, title: e.target.value })
                  }
                  placeholder="Project title"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm">Description</label>
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
                <label className="block mb-1 text-sm">Image Scale</label>
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
                <label className="block mb-2 text-sm">Replace Image</label>
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

            <Button onClick={handleSave} className="w-full">
              <Check className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </motion.div>
        )}

        {isPositioning && isEditMode && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 z-20 rounded-2xl pointer-events-none">
            <div className="pointer-events-auto flex flex-col items-center gap-3">
              {/* Zoom Controls */}
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full p-2 border border-white/20">
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full w-8 h-8 p-0 hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScaleChange(Math.max(0.5, editedProject.scale - 0.1));
                  }}
                >
                  <ZoomOut className="w-4 h-4 text-white" />
                </Button>
                <span className="text-white text-sm font-semibold min-w-[60px] text-center">
                  {Math.round(editedProject.scale * 100)}%
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full w-8 h-8 p-0 hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScaleChange(Math.min(3, editedProject.scale + 0.1));
                  }}
                >
                  <ZoomIn className="w-4 h-4 text-white" />
                </Button>
              </div>

              {/* Position Hint */}
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
                <Move className="w-4 h-4 text-white" />
                <span className="text-white text-sm">Drag image to reposition</span>
              </div>

              {/* Reset Button */}
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>

              {/* Done Button */}
              <Button
                size="sm"
                variant="default"
                className="rounded-full shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPositioning(false);
                }}
              >
                <Check className="w-4 h-4 mr-2" />
                Done
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default ProjectImage;