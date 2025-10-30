import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, Plus, X, Edit2, Image as ImageIcon, Video as VideoIcon, GripVertical, ZoomIn, ZoomOut, Move, RotateCcw, ChevronDown } from "lucide-react";
import { useDrag, useDrop } from "react-dnd";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Lightbox } from "../components/Lightbox";
import { ProjectData } from "../components/ProjectImage";
import { CaseStudySections } from "../components/features/CaseStudySections";
import { PageLayout } from "../components/layout/PageLayout";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "../components/ui/dropdown-menu";
import { AtAGlanceSidebar } from "../components/features/AtAGlanceSidebar";
import { ImpactSidebar } from "../components/features/ImpactSidebar";
import { FlowDiagramGallery } from "../components/FlowDiagramGallery";
import { VideoGallery } from "../components/VideoGallery";
import HeroImage from "../components/HeroImage";
import { useCaseStudySEO } from "../hooks/useSEO";
import { cleanMarkdownContent, isContentCorrupted } from "../utils/cleanMarkdownContent";
import { uploadImage } from "../utils/imageHelpers";

interface ProjectDetailProps {
  project: ProjectData;
  onBack: () => void;
  onUpdate: (updatedProject: ProjectData) => void;
  isEditMode: boolean;
}

interface CaseStudyImage {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  scale?: number;
  position?: { x: number; y: number };
}

interface ImageEditorProps {
  scale: number;
  position: { x: number; y: number };
  onScaleChange: (scale: number) => void;
  onPositionChange: (position: { x: number; y: number }) => void;
  onReset: () => void;
}

const ImageEditor = ({ scale, position, onScaleChange, onPositionChange, onReset }: ImageEditorProps) => {
  // ImageEditor doesn't need dragging - that's handled by the parent
  // This component just shows the controls

  return (
    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 z-20" onClick={(e) => e.stopPropagation()}>
      {/* Zoom Controls */}
      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full p-2 border border-white/20">
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full w-8 h-8 p-0 hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            onScaleChange(Math.max(0.5, scale - 0.1));
          }}
        >
          <ZoomOut className="w-4 h-4 text-white" />
        </Button>
        <span className="text-white text-sm font-semibold min-w-[60px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full w-8 h-8 p-0 hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            onScaleChange(Math.min(3, scale + 0.1));
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
          onReset();
        }}
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset
      </Button>
    </div>
  );
};

interface DraggableImageProps {
  image: CaseStudyImage;
  index: number;
  isEditMode: boolean;
  onRemove: (id: string) => void;
  onImageClick: (image: CaseStudyImage) => void;
  moveImage: (dragIndex: number, hoverIndex: number) => void;
  onImageUpdate: (id: string, updates: Partial<CaseStudyImage>) => void;
  onDragEnd: () => void;
}

const DraggableImage = ({ image, index, isEditMode, onRemove, onImageClick, moveImage, onImageUpdate, onDragEnd }: DraggableImageProps) => {
  const ref = useRef(null);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [isDraggingPosition, setIsDraggingPosition] = useState(false);
  const imageRef = useRef(null);
  
  // Local state for position/scale during editing (to avoid saving on every pixel)
  // Initialize from image prop, but only update when image ID changes
  const [localPosition, setLocalPosition] = useState(() => image.position || { x: 50, y: 50 });
  const [localScale, setLocalScale] = useState(() => image.scale || 1);

  const scale = localScale;
  const position = localPosition;
  
  // Track the current image ID to detect when we switch to a different image
  const prevImageIdRef = useRef(image.id);
  
  // Only sync local state when the image ID changes (new image loaded)
  useEffect(() => {
    if (prevImageIdRef.current !== image.id) {
      setLocalPosition(image.position || { x: 50, y: 50 });
      setLocalScale(image.scale || 1);
      prevImageIdRef.current = image.id;
    }
  }, [image.id]); // Only depend on image.id, not position or scale!

  const [{ isDragging }, drag] = useDrag({
    type: 'image',
    item: { id: image.id, index },
    canDrag: isEditMode && !isEditingImage,
    end: () => {
      // Save when drag ends
      onDragEnd();
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop, draggedItem }, drop] = useDrop({
    accept: 'image',
    hover: (draggedItem: { id: string; index: number }, monitor) => {
      if (!ref.current) return;
      
      const dragIndex = draggedItem.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) return;
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      
      // Only perform the move when the mouse has crossed half of the item's height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      
      // Time to actually perform the action
      moveImage(dragIndex, hoverIndex);
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      draggedItem.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
      draggedItem: monitor.getItem() as { id: string; index: number } | null,
    }),
  });

  drag(drop(ref));

  const handleImageMouseDown = (e: any) => {
    if (!isEditingImage) return;
    e.stopPropagation();
    setIsDraggingPosition(true);
  };

  const handleImageMouseMove = (e: any) => {
    if (!isDraggingPosition || !imageRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    
    const rect = imageRef.current.getBoundingClientRect();
    // Calculate position as percentage within the container
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    
    // Update local state immediately for smooth dragging (don't save yet)
    setLocalPosition({ x, y });
  };

  const handleImageMouseUp = () => {
    if (isDraggingPosition) {
      // Only save when mouse is released (not on every pixel movement)
      onImageUpdate(image.id, { position: localPosition, scale: localScale });
    }
    setIsDraggingPosition(false);
  };

  // Show drop indicator when this position would receive the dragged item
  const showDropIndicator = isOver && canDrop && !isDragging && isEditMode && draggedItem && draggedItem.index !== index;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: isDragging ? 0.3 : 1, 
        scale: isDragging ? 0.95 : 1,
      }}
      transition={{ delay: isDragging ? 0 : 0.7 + index * 0.1 }}
      className={`relative group ${isDragging ? 'z-50 cursor-grabbing' : ''}`}
      style={{ cursor: isEditMode && !isEditingImage && !isDragging ? 'grab' : 'pointer' }}
    >
      {/* Drop Indicator - Shows above where item will land */}
      {showDropIndicator && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          exit={{ opacity: 0, scaleX: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute -top-3 left-0 right-0 h-1.5 rounded-full z-30"
          style={{
            background: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 25%, #3b82f6 50%, #06b6d4 75%, #fbbf24 100%)',
            boxShadow: '0 0 24px rgba(236, 72, 153, 0.9), 0 0 40px rgba(59, 130, 246, 0.7), 0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Pulsing glow effect */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 25%, #3b82f6 50%, #06b6d4 75%, #fbbf24 100%)',
            }}
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      )}
      
      {/* Drag Handle - Only visible in Edit Mode when not editing image */}
      {isEditMode && !isEditingImage && (
        <div className="absolute top-2 left-2 z-20 bg-black/70 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
          <GripVertical className="w-4 h-4" />
        </div>
      )}
      
      {/* Edit Image Button - Only visible in Edit Mode */}
      {isEditMode && !isEditingImage && (
        <Button
          size="sm"
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditingImage(true);
          }}
        >
          <Edit2 className="w-3 h-3 mr-2" />
          Adjust
        </Button>
      )}
      
      <motion.div
        ref={imageRef}
        whileHover={{ scale: isEditMode && !isEditingImage ? 1 : 1.03, y: isEditMode && !isEditingImage ? 0 : -4 }}
        className="aspect-[3/4] overflow-hidden rounded-xl shadow-lg border border-border/20 relative"
        style={{ 
          cursor: isEditingImage ? 'crosshair' : 'pointer',
          background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 25%, #3b82f6 50%, #06b6d4 75%, #fbbf24 100%)'
        }}
        onClick={() => !isEditMode && !isEditingImage && onImageClick(image)}
        onMouseDown={handleImageMouseDown}
        onMouseMove={handleImageMouseMove}
        onMouseUp={handleImageMouseUp}
        onMouseLeave={handleImageMouseUp}
      >
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url(${image.url})`,
            backgroundSize: `${scale * 100}%`,
            backgroundPosition: `${position.x}% ${position.y}%`,
            backgroundRepeat: "no-repeat",
          }}
        />
        
        {/* Image Editor Overlay */}
        {isEditingImage && (
          <>
            <ImageEditor
              scale={scale}
              position={position}
              onScaleChange={(newScale) => setLocalScale(newScale)}
              onPositionChange={(newPos) => setLocalPosition(newPos)}
              onReset={() => {
                setLocalScale(1);
                setLocalPosition({ x: 50, y: 50 });
              }}
            />
            <Button
              size="sm"
              variant="default"
              className="absolute bottom-4 right-4 z-30 shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                // Save changes when clicking "Done"
                onImageUpdate(image.id, { scale: localScale, position: localPosition });
                setIsEditingImage(false);
              }}
            >
              Done
            </Button>
          </>
        )}
      </motion.div>
      {image.alt && (
        <p className="text-sm text-muted-foreground mt-2 text-center">{image.alt}</p>
      )}
      {isEditMode && !isEditingImage && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(image.id);
          }}
          className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};

// Helper function to merge edited content with existing sidebar sections
function mergeContentWithSidebars(editedContent: string, originalContent: string): string {
  // Extract sidebar sections from original content
  const originalLines = originalContent.split('\n');
  const sidebarSections: string[] = [];
  let currentSidebarSection: string[] = [];
  let inSidebarSection = false;
  
  for (const line of originalLines) {
    // Check if this is a sidebar section header
    if (line.trim() === '# At a glance' || 
        line.trim() === '# Impact' || 
        line.trim() === '# Tech stack' || 
        line.trim() === '# Tools') {
      // Save previous sidebar section if exists
      if (currentSidebarSection.length > 0) {
        sidebarSections.push(currentSidebarSection.join('\n'));
      }
      // Start new sidebar section
      currentSidebarSection = [line];
      inSidebarSection = true;
    }
    // Check if we hit another section header (end of sidebar section)
    else if (inSidebarSection && line.trim().startsWith('# ')) {
      // Save current sidebar section
      sidebarSections.push(currentSidebarSection.join('\n'));
      currentSidebarSection = [];
      inSidebarSection = false;
    }
    // Add line to current sidebar section
    else if (inSidebarSection) {
      currentSidebarSection.push(line);
    }
  }
  
  // Save last sidebar section if exists
  if (currentSidebarSection.length > 0) {
    sidebarSections.push(currentSidebarSection.join('\n'));
  }
  
  // Combine edited content with sidebar sections
  const sidebarContent = sidebarSections.length > 0 ? '\n\n' + sidebarSections.join('\n\n') : '';
  return editedContent + sidebarContent;
}

export function ProjectDetail({ project, onBack, onUpdate, isEditMode }: ProjectDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  
  // Debug logging for project data
  useEffect(() => {
    // Removed excessive logging for performance
    
    // Check if we need to convert snake_case to camelCase
    const hasSnakeCase = 'case_study_images' in (project as any);
    const hasCamelCase = 'caseStudyImages' in project;
    
    if (hasSnakeCase && !hasCamelCase) {
      // Update the image arrays with converted data
      const snakeCaseImages = (project as any).case_study_images || [];
      const snakeCaseFlowDiagrams = (project as any).flow_diagram_images || [];
      const snakeCaseVideos = (project as any).video_items || [];
      
      // Update the state with converted data
      setCaseStudyImages(snakeCaseImages);
      setFlowDiagramImages(snakeCaseFlowDiagrams);
      setVideoItems(snakeCaseVideos);
    }
    
    // Check authentication status
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const isBypassAuth = localStorage.getItem('isAuthenticated') === 'true';
      console.log('📄 ProjectDetail: Current user:', user ? user.email : (isBypassAuth ? 'Bypass authenticated' : 'Not authenticated'));
    };
    checkAuth();
  }, [project]);
  
  const [editedTitle, setEditedTitle] = useState(project.title);
  const [editedDescription, setEditedDescription] = useState(project.description);
  const [caseStudyContent, setCaseStudyContent] = useState(
    project.caseStudyContent || (project as any).case_study_content || "Add your detailed case study content here. Describe the challenge, process, solution, and results."
  );
  const [caseStudyImages, setCaseStudyImages] = useState(() => {
    // Handle both camelCase and snake_case formats
    const camelCaseImages = project.caseStudyImages;
    const snakeCaseImages = (project as any).case_study_images;
    const images = camelCaseImages || snakeCaseImages || [];
    
    console.log('🖼️ ProjectDetail: Initializing caseStudyImages:', {
      camelCase: camelCaseImages?.length || 0,
      snakeCase: snakeCaseImages?.length || 0,
      final: images.length,
      camelCaseData: camelCaseImages,
      snakeCaseData: snakeCaseImages,
      finalData: images,
      projectKeys: Object.keys(project),
      hasCamelCase: 'caseStudyImages' in project,
      hasSnakeCase: 'case_study_images' in (project as any)
    });
    return images;
  });
  const [flowDiagramImages, setFlowDiagramImages] = useState(() => {
    // Handle both camelCase and snake_case formats
    const images = project.flowDiagramImages || (project as any).flow_diagram_images || [];
    console.log('🖼️ ProjectDetail: Initializing flowDiagramImages:', {
      camelCase: project.flowDiagramImages?.length || 0,
      snakeCase: (project as any).flow_diagram_images?.length || 0,
      final: images.length
    });
    return images;
  });
  const [videoItems, setVideoItems] = useState(() => {
    // Handle both camelCase and snake_case formats
    const videos = project.videoItems || (project as any).video_items || [];
    console.log('🖼️ ProjectDetail: Initializing videoItems:', {
      camelCase: project.videoItems?.length || 0,
      snakeCase: (project as any).video_items?.length || 0,
      final: videos.length
    });
    return videos;
  });
  
  const [projectImagesPosition, setProjectImagesPosition] = useState(
    project.projectImagesPosition || (project as any).project_images_position || 
    (caseStudyImages.length > 0 ? 2 : undefined) // Default position 2 if images exist but no position set
  );
  const [videosPosition, setVideosPosition] = useState(
    project.videosPosition || (project as any).videos_position
  );
  
  const [flowDiagramsPosition, setFlowDiagramsPosition] = useState(
    project.flowDiagramsPosition || (project as any).flow_diagrams_position
  );
  const [solutionCardsPosition, setSolutionCardsPosition] = useState(
    project.solutionCardsPosition || (project as any).solution_cards_position
  );
  
  
  // NEW: Track positions for ALL sections (markdown + sidebars + galleries)
  const [sectionPositions, setSectionPositions] = useState(() => {
    // Use provided positions if present
    if (project.sectionPositions && Object.keys(project.sectionPositions).length > 0) {
      return project.sectionPositions;
    }
    // Minimal sensible defaults: only include sections that exist
    const positions: Record<string, number> = { 'Overview': 0 };
    let next = 1;
    if (project.projectImagesPosition !== undefined) positions['__PROJECT_IMAGES__'] = next++;
    if (project.videosPosition !== undefined) positions['__VIDEOS__'] = next++;
    if (project.flowDiagramsPosition !== undefined) positions['__FLOW_DIAGRAMS__'] = next++;
    if (project.solutionCardsPosition !== undefined) positions['__SOLUTION_CARDS__'] = next++;
    return positions;
  });
  
  // (Handlers moved below after aspect/columns state to avoid TDZ)
  
  // Use refs to track latest values to avoid stale state in callbacks
  const caseStudyImagesRef = useRef(caseStudyImages);
  const flowDiagramImagesRef = useRef(flowDiagramImages);
  const videoItemsRef = useRef(videoItems);
  
  // Keep refs in sync with state
  useEffect(() => {
    caseStudyImagesRef.current = caseStudyImages;
  }, [caseStudyImages]);
  
  useEffect(() => {
    flowDiagramImagesRef.current = flowDiagramImages;
  }, [flowDiagramImages]);
  
  useEffect(() => {
    videoItemsRef.current = videoItems;
  }, [videoItems]);
  const [galleryAspectRatio, setGalleryAspectRatio] = useState(
    project.galleryAspectRatio || (project as any).gallery_aspect_ratio || "3x4"
  );
  const [flowDiagramAspectRatio, setFlowDiagramAspectRatio] = useState(
    project.flowDiagramAspectRatio || (project as any).flow_diagram_aspect_ratio || "16x9"
  );
  const [galleryColumns, setGalleryColumns] = useState(
    project.galleryColumns || (project as any).gallery_columns || 2
  );
  const [flowDiagramColumns, setFlowDiagramColumns] = useState(
    project.flowDiagramColumns || (project as any).flow_diagram_columns || 1
  );
  const [videoAspectRatio, setVideoAspectRatio] = useState(
    project.videoAspectRatio || (project as any).video_aspect_ratio || "16x9"
  );
  const [videoColumns, setVideoColumns] = useState(
    project.videoColumns || (project as any).video_columns || 1
  );
  const [lightboxImage, setLightboxImage] = useState(null);
  const [flowDiagramLightboxImage, setFlowDiagramLightboxImage] = useState(null);
  const [isEditingHeroImage, setIsEditingHeroImage] = useState(false);
  // Helper: compute next available position index for gallery-type sections
  const getNextPosition = useCallback(() => {
    const candidates: number[] = [];
    if (projectImagesPosition !== undefined) candidates.push(projectImagesPosition);
    if (videosPosition !== undefined) candidates.push(videosPosition);
    if (flowDiagramsPosition !== undefined) candidates.push(flowDiagramsPosition);
    if (solutionCardsPosition !== undefined) candidates.push(solutionCardsPosition);
    const markdownCount = (caseStudyContent?.split('\n').filter(l => /^#\s+/.test((l||'').trim())).length) || 1;
    const maxPos = candidates.length > 0 ? Math.max(...candidates, markdownCount) : markdownCount;
    return (isFinite(maxPos) ? maxPos : 0) + 1;
  }, [projectImagesPosition, videosPosition, flowDiagramsPosition, solutionCardsPosition, caseStudyContent]);

  // Add sections after project creation (for Custom/blank or any project)
  const handleAddOverviewSection = useCallback(() => {
    const base = caseStudyContent || '';
    const prefix = base.trim().length > 0 ? '\n\n---\n\n' : '';
    const newContent = `${base}${prefix}# Overview\n\nAdd an overview of the project.`;
    setCaseStudyContent(newContent);
    const updatedProject: ProjectData = {
      ...project,
      title: editedTitle,
      description: editedDescription,
      caseStudyContent: newContent,
      caseStudyImages: caseStudyImagesRef.current,
      flowDiagramImages: flowDiagramImagesRef.current,
      videoItems: videoItemsRef.current,
      galleryAspectRatio,
      flowDiagramAspectRatio,
      videoAspectRatio,
      galleryColumns,
      flowDiagramColumns,
      videoColumns,
      projectImagesPosition,
      videosPosition,
      flowDiagramsPosition,
      solutionCardsPosition,
      sectionPositions,
    };
    onUpdate(updatedProject);
    console.log('✅ Overview section added');
  }, [caseStudyContent, project, editedTitle, editedDescription, galleryAspectRatio, flowDiagramAspectRatio, videoAspectRatio, galleryColumns, flowDiagramColumns, videoColumns, projectImagesPosition, videosPosition, flowDiagramsPosition, solutionCardsPosition, sectionPositions, onUpdate]);

  const handleAddVideosSection = useCallback(() => {
    const next = getNextPosition();
    setVideosPosition(next);
    const updatedProject: ProjectData = {
      ...project,
      title: editedTitle,
      description: editedDescription,
      caseStudyContent,
      caseStudyImages: caseStudyImagesRef.current,
      flowDiagramImages: flowDiagramImagesRef.current,
      videoItems: videoItemsRef.current,
      galleryAspectRatio,
      flowDiagramAspectRatio,
      videoAspectRatio,
      galleryColumns,
      flowDiagramColumns,
      videoColumns,
      projectImagesPosition,
      videosPosition: next,
      flowDiagramsPosition,
      solutionCardsPosition,
      sectionPositions,
    };
    onUpdate(updatedProject);
  }, [getNextPosition, project, editedTitle, editedDescription, caseStudyContent, galleryAspectRatio, flowDiagramAspectRatio, videoAspectRatio, galleryColumns, flowDiagramColumns, videoColumns, projectImagesPosition, flowDiagramsPosition, solutionCardsPosition, sectionPositions, onUpdate]);

  const handleAddImagesSection = useCallback(() => {
    const next = getNextPosition();
    setProjectImagesPosition(next);
    const updatedProject: ProjectData = {
      ...project,
      title: editedTitle,
      description: editedDescription,
      caseStudyContent,
      caseStudyImages: caseStudyImagesRef.current,
      flowDiagramImages: flowDiagramImagesRef.current,
      videoItems: videoItemsRef.current,
      galleryAspectRatio,
      flowDiagramAspectRatio,
      videoAspectRatio,
      galleryColumns,
      flowDiagramColumns,
      videoColumns,
      projectImagesPosition: next,
      videosPosition,
      flowDiagramsPosition,
      solutionCardsPosition,
      sectionPositions,
    };
    onUpdate(updatedProject);
  }, [getNextPosition, project, editedTitle, editedDescription, caseStudyContent, galleryAspectRatio, flowDiagramAspectRatio, videoAspectRatio, galleryColumns, flowDiagramColumns, videoColumns, videosPosition, flowDiagramsPosition, solutionCardsPosition, sectionPositions, onUpdate]);

  const handleAddFlowsSection = useCallback(() => {
    const next = getNextPosition();
    setFlowDiagramsPosition(next);
    const updatedProject: ProjectData = {
      ...project,
      title: editedTitle,
      description: editedDescription,
      caseStudyContent,
      caseStudyImages: caseStudyImagesRef.current,
      flowDiagramImages: flowDiagramImagesRef.current,
      videoItems: videoItemsRef.current,
      galleryAspectRatio,
      flowDiagramAspectRatio,
      videoAspectRatio,
      galleryColumns,
      flowDiagramColumns,
      videoColumns,
      projectImagesPosition,
      videosPosition,
      flowDiagramsPosition: next,
      solutionCardsPosition,
      sectionPositions,
    };
    onUpdate(updatedProject);
  }, [getNextPosition, project, editedTitle, editedDescription, caseStudyContent, galleryAspectRatio, flowDiagramAspectRatio, videoAspectRatio, galleryColumns, flowDiagramColumns, videoColumns, projectImagesPosition, videosPosition, solutionCardsPosition, sectionPositions, onUpdate]);

  const handleAddSolutionCardsSection = useCallback(() => {
    const next = getNextPosition();
    setSolutionCardsPosition(next);
    const updatedProject: ProjectData = {
      ...project,
      title: editedTitle,
      description: editedDescription,
      caseStudyContent,
      caseStudyImages: caseStudyImagesRef.current,
      flowDiagramImages: flowDiagramImagesRef.current,
      videoItems: videoItemsRef.current,
      galleryAspectRatio,
      flowDiagramAspectRatio,
      videoAspectRatio,
      galleryColumns,
      flowDiagramColumns,
      videoColumns,
      projectImagesPosition,
      videosPosition,
      flowDiagramsPosition,
      solutionCardsPosition: next,
      sectionPositions,
    };
    onUpdate(updatedProject);
  }, [getNextPosition, project, editedTitle, editedDescription, caseStudyContent, galleryAspectRatio, flowDiagramAspectRatio, videoAspectRatio, galleryColumns, flowDiagramColumns, videoColumns, projectImagesPosition, videosPosition, flowDiagramsPosition, sectionPositions, onUpdate]);

  // Helpers to detect presence of markdown sections
  const hasMarkdownTitle = useCallback((title: string) => {
    const lines = (caseStudyContent || '').split('\n');
    const hasTitle = lines.some(l => l.trim().match(/^# (.+)$/)?.[1].trim() === title);
    console.log('🔍 hasMarkdownTitle check:', { title, hasTitle, caseStudyContent: caseStudyContent?.substring(0, 200) });
    return hasTitle;
  }, [caseStudyContent]);

  const addMarkdownSection = useCallback((title: string, body: string) => {
    console.log('🔄 addMarkdownSection called:', { title, body });
    const base = caseStudyContent || '';
    const prefix = base.trim().length > 0 ? '\n\n---\n\n' : '';
    // Seed sensible starter content so sections render immediately
    let seeded = body;
    const lower = title.toLowerCase();
    // Route sidebars to JSON storage, not markdown
    if (lower === 'impact' || lower === 'at a glance' || lower === 'sidebar 1' || lower === 'sidebar 2') {
      const key = (lower === 'impact' || lower === 'sidebar 2') ? 'impact' : 'atGlance';
      const updatedSidebars = {
        ...(caseStudySidebars || {}),
        [key]: { title, content: body || '', hidden: false }
      } as any;

      const updatedSectionPositions = {
        ...(sectionPositions as any) || (project as any)?.sectionPositions || {},
        ...(key === 'impact' ? { hideImpact: false } : { hideAtAGlance: false })
      } as any;

      setCaseStudySidebars(updatedSidebars);
      // Immediately remove any legacy blocks from markdown to avoid leakage
      const cleaned = stripLegacySidebarBlocks(caseStudyContent || '');
      if (cleaned !== (caseStudyContent || '')) setCaseStudyContent(cleaned);
      onUpdate({
        ...project,
        sectionPositions: updatedSectionPositions,
        section_positions: updatedSectionPositions,
        caseStudySidebars: updatedSidebars,
        case_study_sidebars: updatedSidebars
      } as any);
      return;
    }
    if (lower.includes('research insights')) {
      seeded = '## Insight 1\nDescribe the insight and evidence.\n';
    } else if (lower.includes('key features')) {
      seeded = '## Feature 1\nDescribe the feature and impact.\n';
    } else if (lower.includes('competitive analysis')) {
      seeded = '## Competitor 1\nSummary with strengths and limitations.\n- Strength 1\n- Limitation 1\n';
    } else if (lower.includes('my role')) {
      seeded = '## Design\n- Contribution 1\n- Contribution 2\n\n## Research\n- Contribution 1\n';
    } else if (lower.includes('the solution')) {
      seeded = 'Describe your solution approach and why it works.';
    } else if (lower.includes('the challenge')) {
      // IMPORTANT: Avoid using a subsection titled "Impact" here, because the sidebar parser
      // extracts any "Impact" subsection as the Impact sidebar. Use a different heading.
      seeded = '## Problem statement\nDescribe the main problem or challenge.\n\n## Context\nProvide background and context.\n\n## Consequences\nExplain what happens if this challenge is not solved.';
    }
    const newContent = `${base}${prefix}# ${title}\n\n${seeded}`;
    console.log('📝 Adding markdown section:', { title, newContentLength: newContent.length });
    setCaseStudyContent(newContent);
    // Mark unsaved and update local flags/state; defer persist until Save
    try { document.body.setAttribute('data-unsaved', 'true'); } catch {}
    // Clear persistent hide flags when adding sidebars back
    const lowerTitle = title.toLowerCase();
    const updatedSectionPositions = {
      ...(sectionPositions as any) || (project as any)?.sectionPositions || {},
      ...(lowerTitle === 'impact' ? { hideImpact: false } : {}),
      ...(lowerTitle === 'at a glance' ? { hideAtAGlance: false } : {})
    };
    setSectionPositions(updatedSectionPositions as any);
  }, [caseStudyContent, project, editedTitle, editedDescription, galleryAspectRatio, flowDiagramAspectRatio, videoAspectRatio, galleryColumns, flowDiagramColumns, videoColumns, projectImagesPosition, videosPosition, flowDiagramsPosition, solutionCardsPosition, sectionPositions, onUpdate]);

  const removeMarkdownSection = useCallback((title: string) => {
    const lines = (caseStudyContent || '').split('\n');
    const newLines: string[] = [];
    let inTarget = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const header = line.trim().match(/^# (.+)$/);
      if (header && header[1].trim() === title) {
        inTarget = true; // start skipping
        continue;
      }
      if (inTarget && line.trim().match(/^# (.+)$/)) {
        inTarget = false; // hit next section
      }
      if (!inTarget) newLines.push(line);
    }
    const newContent = newLines.join('\n');
    setCaseStudyContent(newContent);
    onUpdate({
      ...project,
      title: editedTitle,
      description: editedDescription,
      caseStudyContent: newContent,
      caseStudyImages: caseStudyImagesRef.current,
      flowDiagramImages: flowDiagramImagesRef.current,
      videoItems: videoItemsRef.current,
      galleryAspectRatio,
      flowDiagramAspectRatio,
      videoAspectRatio,
      galleryColumns,
      flowDiagramColumns,
      videoColumns,
      projectImagesPosition,
      videosPosition,
      flowDiagramsPosition,
      solutionCardsPosition,
      sectionPositions,
    });
  }, [caseStudyContent, project, editedTitle, editedDescription, galleryAspectRatio, flowDiagramAspectRatio, videoAspectRatio, galleryColumns, flowDiagramColumns, videoColumns, projectImagesPosition, videosPosition, flowDiagramsPosition, solutionCardsPosition, sectionPositions, onUpdate]);
  // Hero image positioning - completely independent from home screen
  // Case study detail screen has its own positioning that doesn't affect home screen
  const [heroScale, setHeroScale] = useState(1);
  const [heroPosition, setHeroPosition] = useState({ x: 50, y: 50 });
  const [isDraggingHero, setIsDraggingHero] = useState(false);
  const heroImageRef = useRef(null);
  
  // Store original content when entering edit mode (for Cancel functionality)
  const [originalContent, setOriginalContent] = useState(caseStudyContent);

  // Sidebars via JSON with local state to reflect immediate edits
  const [caseStudySidebars, setCaseStudySidebars] = useState<any>(() => {
    return (project as any).caseStudySidebars || (project as any).case_study_sidebars || {};
  });
  useEffect(() => {
    setCaseStudySidebars((project as any).caseStudySidebars || (project as any).case_study_sidebars || {});
  }, [project]);

  // Clean up corrupted content on mount and use cleaned content for parsing
  // ALSO strip legacy sidebar blocks on LOAD if JSON sidebars exist
  const [cleanedContent, setCleanedContent] = useState(caseStudyContent);
  
  useEffect(() => {
    const hasAt = Boolean((caseStudySidebars as any)?.atGlance);
    const hasImpact = Boolean((caseStudySidebars as any)?.impact);
    
    if (!hasAt && !hasImpact) {
      // No JSON sidebars, just clean corrupted content if needed
      if (isContentCorrupted(caseStudyContent)) {
        console.log('🧹 Detected corrupted content, cleaning up...');
        const cleaned = cleanMarkdownContent(caseStudyContent);
        setCleanedContent(cleaned);
        setCaseStudyContent(cleaned);
      } else {
        setCleanedContent(caseStudyContent);
      }
      return;
    }
    
    // JSON sidebars exist - aggressively strip legacy blocks AND non-whitelisted sections from markdown
    const src = caseStudyContent || '';
    let cleaned = src;
    
    // Strip all sidebar-related headers and their content
    const titlesToStrip: string[] = [];
    if (hasAt) titlesToStrip.push('At a glance', 'Sidebar 1');
    if (hasImpact) titlesToStrip.push('Impact', 'Sidebar 2');
    
    if (titlesToStrip.length > 0) {
      const escaped = titlesToStrip.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const pattern = new RegExp(`^#\\s*(?:${escaped.join('|')})\\s*\n[\\s\\S]*?(?=\n#\\s|\n?$)`, 'gmi');
      cleaned = cleaned.replace(pattern, '').trim();
    }
    
    // Also strip non-whitelisted sections when JSON sidebars exist
    const whitelistedSections = [
      'Overview', 'The challenge', 'My role', 'My role & impact', 'Research insights', 
      'Competitive analysis', 'The solution', 'Solution cards', 'Key features'
    ];
    const excludedSidebarTitles = ['Sidebar 1', 'Sidebar 2', 'At a glance', 'Impact', 'Tech stack', 'Tools'];
    
    const lines = cleaned.split('\n');
    const filteredLines: string[] = [];
    let skipSection = false;
    let currentSectionTitle = '';
    
    for (const line of lines) {
      const headerMatch = line.trim().match(/^#\s+(.+)$/);
      if (headerMatch) {
        currentSectionTitle = headerMatch[1].trim();
        const t = currentSectionTitle.toLowerCase();
        
        // Always skip sidebar titles
        if (excludedSidebarTitles.includes(currentSectionTitle) || t === 'at a glance' || t === 'impact' || t === 'sidebar 1' || t === 'sidebar 2' || t === 'tech stack' || t === 'tools') {
          skipSection = true;
          continue;
        }
        
        // Only allow whitelisted sections
        const isWhitelisted = whitelistedSections.some(w => {
          const wLower = w.toLowerCase();
          return t === wLower || t.startsWith(wLower + ' ') || t.includes(wLower);
        });
        if (!isWhitelisted) {
          console.log('🧹 Stripping non-whitelisted section on LOAD:', currentSectionTitle);
          skipSection = true;
          continue;
        }
        
        skipSection = false;
      }
      
      if (!skipSection) {
        filteredLines.push(line);
      }
    }
    
    cleaned = filteredLines.join('\n').trim();
    
    // Also clean corrupted content if needed
    if (isContentCorrupted(cleaned)) {
      cleaned = cleanMarkdownContent(cleaned);
    }
    
    // Only update if we actually removed something
    if (cleaned !== src) {
      console.log('🧹 Stripping legacy sidebar blocks and non-whitelisted sections on LOAD (JSON authoritative)');
      setCleanedContent(cleaned);
      setCaseStudyContent(cleaned);
      
      // Persist the cleaned markdown immediately
      onUpdate({
        ...project,
        caseStudyContent: cleaned,
        case_study_content: cleaned,
        caseStudySidebars: caseStudySidebars,
        case_study_sidebars: caseStudySidebars
      } as any);
    } else {
      setCleanedContent(cleaned);
    }
  }, [caseStudyContent, caseStudySidebars, project, onUpdate]); // Run when content or JSON sidebars change

  

  // Parse sections directly to extract sidebar sections - memoized to prevent re-parsing on every render
  const { atGlanceContent, impactContent, needsSidebarRestore } = useMemo(() => {
    // Read persistent hide flags from latest local sectionPositions state when available
    const currentSectionPositions = (sectionPositions as any) || (project as any)?.sectionPositions || {};
    const hideAtAGlance = Boolean(currentSectionPositions?.hideAtAGlance);
    const hideImpact = Boolean(currentSectionPositions?.hideImpact);

    // Prefer JSON per-key, but fallback to legacy markdown for keys that are missing in JSON
    const atJson = (caseStudySidebars as any).atGlance;
    const impactJson = (caseStudySidebars as any).impact;

    const lines = cleanedContent?.split('\n') || [];
    let currentSection: { title: string; content: string } | null = null;
    let currentSubsection: { title: string; content: string } | null = null;
    let atGlanceSection: { title: string; content: string } | null = null;
    let impactSection: { title: string; content: string } | null = null;

    // Check if we need to restore missing sidebar sections
    const hasAtAGlance = lines.some(line => line.trim() === '# At a glance');
    const hasImpact = lines.some(line => line.trim() === '# Impact');

    lines.forEach(line => {
      // Check for top-level section (# Header)
      if (line.trim().match(/^# (.+)$/)) {
        // Save previous section if it was a sidebar section
        if (currentSection) {
          const title = currentSection.title.toLowerCase();
          if (title === "at a glance" || title === "tools" || title === "tech stack") {
            if (!atGlanceSection) { // Only set if not already found
              atGlanceSection = currentSection;
            }
          } else if (title === "impact") {
            if (!impactSection) { // Only set if not already found
              impactSection = currentSection;
            }
          }
        }
        
        const title = (line || '').trim().substring(1).trim();
        currentSection = { title, content: '' };
        currentSubsection = null; // Reset subsection
      }
      // Check for subsection (## Header)
      else if (line.trim().match(/^## (.+)$/)) {
        const title = (line || '').trim().substring(3).trim();
        currentSubsection = { title, content: '' };
      }
      // Add content to current subsection or section
      else if (currentSubsection) {
        currentSubsection.content += line + '\n';
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    });

    // Check if last section is a sidebar section
    if (currentSection) {
      const title = currentSection.title.toLowerCase();
      if (title === "at a glance" || title === "tools" || title === "tech stack") {
        if (!atGlanceSection) { // Only set if not already found
          atGlanceSection = currentSection;
        }
      } else if (title === "impact") {
        if (!impactSection) { // Only set if not already found
          impactSection = currentSection;
        }
      }
    }


    const resolvedAt = hideAtAGlance
      ? null
      : (atJson ? { title: atJson.title || 'Sidebar 1', content: atJson.content || '' } : atGlanceSection);
    const resolvedImpact = hideImpact
      ? null
      : (impactJson ? { title: impactJson.title || 'Sidebar 2', content: impactJson.content || '' } : impactSection);

    return {
      atGlanceContent: resolvedAt,
      impactContent: resolvedImpact,
      // Only auto-restore when both JSON and markdown are missing and user didn't hide
      needsSidebarRestore:
        ((!resolvedAt && !hideAtAGlance) && !hasAtAGlance && !atJson) ||
        ((!resolvedImpact && !hideImpact) && !hasImpact && !impactJson)
    };
  }, [cleanedContent, sectionPositions, (project as any)?.sectionPositions, caseStudySidebars]);

  // Build the sidebars object to persist based on current UI state (JSON first, fallback to resolved content)
  const buildPersistedSidebars = useCallback(() => {
    const base: any = { ...(caseStudySidebars as any) };
    const currentSectionPositions = (sectionPositions as any) || (project as any)?.sectionPositions || {};
    const hideAtAGlance = Boolean(currentSectionPositions?.hideAtAGlance);
    const hideImpact = Boolean(currentSectionPositions?.hideImpact);

    if (atGlanceContent) {
      base.atGlance = {
        title: atGlanceContent.title || 'Sidebar 1',
        content: atGlanceContent.content || '',
        hidden: hideAtAGlance
      };
    } else if (base.atGlance) {
      // Keep existing hidden state if currently hidden
      base.atGlance = { ...base.atGlance, hidden: hideAtAGlance };
    }

    if (impactContent) {
      base.impact = {
        title: impactContent.title || 'Sidebar 2',
        content: impactContent.content || '',
        hidden: hideImpact
      };
    } else if (base.impact) {
      base.impact = { ...base.impact, hidden: hideImpact };
    }

    return base;
  }, [caseStudySidebars, atGlanceContent, impactContent, sectionPositions, project]);

  // Remove legacy sidebar blocks from markdown for keys that exist in JSON
  const stripLegacySidebarBlocks = useCallback((content: string) => {
    if (!content) return content;
    const hasAt = Boolean((caseStudySidebars as any)?.atGlance);
    const hasImpact = Boolean((caseStudySidebars as any)?.impact);
    if (!hasAt && !hasImpact) return content;

    // Build a case-insensitive regex that strips whole blocks starting at a matching H1
    const titlesToStrip: string[] = [];
    if (hasAt) titlesToStrip.push('At a glance', 'Sidebar 1');
    if (hasImpact) titlesToStrip.push('Impact', 'Sidebar 2');
    if (titlesToStrip.length === 0) return content;

    const escaped = titlesToStrip.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`^#\\s*(?:${escaped.join('|')})\\s*\n[\\s\\S]*?(?=\n#\\s|\n?$)`, 'gmi');
    return (content || '').replace(pattern, '').trim();
  }, [caseStudySidebars]);

  // With JSON sidebars authoritative, skip auto-seeding via markdown
  useEffect(() => {
    // One-time cleanup: strip legacy blocks only for sidebars that exist in JSON.
    const hasJsonAt = Boolean((caseStudySidebars as any).atGlance);
    const hasJsonImpact = Boolean((caseStudySidebars as any).impact);
    if (!hasJsonAt && !hasJsonImpact) return;

    const src = caseStudyContent || '';
    const lines = src.split('\n');
    const out: string[] = [];
    let i = 0;
    let changed = false;
    const shouldStripHeader = (s: string) => {
      const t = s.trim();
      if (hasJsonAt && (t === '# Sidebar 1' || t === '# At a glance')) return true;
      if (hasJsonImpact && (t === '# Sidebar 2' || t === '# Impact')) return true;
      return false;
    };
    while (i < lines.length) {
      const line = lines[i];
      if (shouldStripHeader(line)) {
        changed = true;
        i++;
        // Skip until next top-level header
        while (i < lines.length && !lines[i].trim().match(/^#\s+.+$/)) i++;
        continue;
      }
      out.push(line);
      i++;
    }
    const cleaned = out.join('\n');
    if (changed && cleaned !== src) {
      console.log('🧹 Stripping legacy sidebar blocks for keys present in JSON');
      setCaseStudyContent(cleaned);
    }
  }, [needsSidebarRestore, caseStudyContent, caseStudySidebars]);

  // Track previous content to avoid unnecessary saves
  const prevContentRef = useRef('');
  const prevTitleRef = useRef('');
  const prevDescriptionRef = useRef('');
  const prevImagesRef = useRef('');
  const prevFlowDiagramsRef = useRef('');
  const prevVideosRef = useRef('');

  // Auto-save content changes with debouncing
  useEffect(() => {
    // Explicit-save mode: do not persist while user is editing. Save only via Save/Done.
    if (isEditMode) {
      return;
    }
    const currentContent = caseStudyContent || '';
    const currentTitle = editedTitle || '';
    const currentDescription = editedDescription || '';
    
    // Initialize refs on first render
    if (prevContentRef.current === '' && currentContent) {
      prevContentRef.current = currentContent;
      prevTitleRef.current = currentTitle;
      prevDescriptionRef.current = currentDescription;
      prevImagesRef.current = JSON.stringify(caseStudyImages);
      prevFlowDiagramsRef.current = JSON.stringify(flowDiagramImagesRef.current);
      prevVideosRef.current = JSON.stringify(videoItemsRef.current);
      console.log('🔄 Initialized refs with current state');
      return; // Skip save on first render
    }
    
    // Check if content actually changed
    const contentChanged = currentContent !== prevContentRef.current;
    const titleChanged = currentTitle !== prevTitleRef.current;
    const descriptionChanged = currentDescription !== prevDescriptionRef.current;
    
    // Check for image changes by comparing with previous state
    const currentImagesStr = JSON.stringify(caseStudyImages);
    const currentFlowDiagramsStr = JSON.stringify(flowDiagramImagesRef.current);
    const currentVideosStr = JSON.stringify(videoItemsRef.current);
    
    const imagesChanged = currentImagesStr !== prevImagesRef.current;
    const flowDiagramsChanged = currentFlowDiagramsStr !== prevFlowDiagramsRef.current;
    const videosChanged = currentVideosStr !== prevVideosRef.current;
    
    // Check for unsaved changes flag
    const hasUnsavedFlag = document.body.hasAttribute('data-unsaved');

    // Only proceed if something actually changed OR unsaved flag is set
    if (!contentChanged && !titleChanged && !descriptionChanged && !imagesChanged && !flowDiagramsChanged && !videosChanged && !hasUnsavedFlag) {
      console.log('⏭️ Auto-save skipped - no changes detected', {
        contentChanged,
        titleChanged,
        descriptionChanged,
        imagesChanged,
        flowDiagramsChanged,
        videosChanged,
        hasUnsavedFlag,
        reason: 'All change checks returned false'
      });
      return;
    }

    const timeoutId = setTimeout(() => {
      console.log('⏰ Auto-save timeout triggered');
      // Always save if we're in edit mode and content exists
      if (isEditMode && caseStudyContent && caseStudyContent.length > 0) {
        // Clean blob URLs from content before saving
        const cleanBlobUrls = (content: string): string => {
          if (!content) return content;
          return content.replace(/blob:http:\/\/[^\s)]+/g, '');
        };
        
        const cleanedContent = cleanBlobUrls(caseStudyContent);
        const blobUrlCount = (caseStudyContent.match(/blob:http:\/\/[^\s)]+/g) || []).length;
        
        console.log('💾 Auto-saving content changes...', {
          title: editedTitle,
          description: editedDescription,
          contentLength: caseStudyContent.length,
          blobUrlsRemoved: blobUrlCount,
          originalContent: caseStudyContent.substring(0, 100) + '...',
          cleanedContent: cleanedContent.substring(0, 100) + '...'
        });
        
        // Update refs to current values
        prevContentRef.current = currentContent;
        prevTitleRef.current = currentTitle;
        prevDescriptionRef.current = currentDescription;
        prevImagesRef.current = currentImagesStr;
        prevFlowDiagramsRef.current = currentFlowDiagramsStr;
        prevVideosRef.current = currentVideosStr;
        
        console.log('📤 ProjectDetail: Calling onUpdate with:', {
          id: project.id,
          title: editedTitle,
          description: editedDescription,
          contentLength: caseStudyContent?.length || 0
        });
        
        onUpdate({
          ...project,
          title: editedTitle,
          description: editedDescription,
          caseStudyContent: cleanedContent,
          caseStudyImages,
          flowDiagramImages: flowDiagramImagesRef.current,
          videoItems: videoItemsRef.current,
          galleryAspectRatio,
          flowDiagramAspectRatio,
          videoAspectRatio,
          galleryColumns,
          flowDiagramColumns,
          videoColumns,
          projectImagesPosition,
          videosPosition,
          flowDiagramsPosition,
          solutionCardsPosition,
        });
      } else {
        console.log('❌ Auto-save skipped - DETAILED REASON:', {
          isEditMode,
          hasContent: !!caseStudyContent,
          contentLength: caseStudyContent?.length || 0,
          contentTrimmed: caseStudyContent?.trim() || '',
          contentTrimmedLength: caseStudyContent?.trim()?.length || 0,
          'isEditMode check': isEditMode,
          'hasContent check': !!caseStudyContent,
          'trimmed check': caseStudyContent?.trim() ? true : false,
          'FINAL CONDITION': `isEditMode: ${isEditMode}, hasContent: ${!!caseStudyContent}, trimmed: ${caseStudyContent?.trim() ? true : false}`,
          'WHY SKIPPED': !isEditMode ? 'NOT IN EDIT MODE' : !caseStudyContent ? 'NO CONTENT' : !caseStudyContent?.trim() ? 'CONTENT IS EMPTY AFTER TRIM' : 'UNKNOWN'
        });
      }
    }, 2000); // Save 2 seconds after last change

    return () => clearTimeout(timeoutId);
  }, [caseStudyContent, editedTitle, editedDescription, isEditMode, project, onUpdate]);

  // Immediate save when user stops typing (onBlur)
  const handleContentBlur = () => {
    console.log('🖱️ Textarea blur triggered:', {
      isEditMode,
      hasContent: !!caseStudyContent,
      contentLength: caseStudyContent?.length || 0
    });
    
    if (isEditMode && caseStudyContent && caseStudyContent.trim()) {
      console.log('💾 Immediate save on blur...');
      
      console.log('📤 ProjectDetail: Calling onUpdate (blur) with:', {
        id: project.id,
        title: editedTitle,
        description: editedDescription,
        contentLength: caseStudyContent?.length || 0
      });
      
      onUpdate({
        ...project,
        title: editedTitle,
        description: editedDescription,
        caseStudyContent,
      });
      } else {
        console.log('❌ Blur save skipped - DETAILED REASON:', {
          isEditMode,
          hasContent: !!caseStudyContent,
          contentLength: caseStudyContent?.length || 0,
          contentTrimmed: caseStudyContent?.trim() || '',
          contentTrimmedLength: caseStudyContent?.trim()?.length || 0,
          'isEditMode check': isEditMode,
          'hasContent check': !!caseStudyContent,
          'trimmed check': caseStudyContent?.trim() ? true : false,
          'FINAL CONDITION': `isEditMode: ${isEditMode}, hasContent: ${!!caseStudyContent}, trimmed: ${caseStudyContent?.trim() ? true : false}`,
          'WHY SKIPPED': !isEditMode ? 'NOT IN EDIT MODE' : !caseStudyContent ? 'NO CONTENT' : !caseStudyContent?.trim() ? 'CONTENT IS EMPTY AFTER TRIM' : 'UNKNOWN'
        });
      }
  };

  // NOTE: No useEffect for flowDiagramImages or caseStudyImages auto-save
  // The inline saves in onImagesChange callbacks handle this correctly
  // A useEffect here would create a race condition and save stale data

  const handleSave = () => {
    // CRITICAL: Use refs to get latest image arrays, not stale state
    const persistedSidebars = buildPersistedSidebars();
    const cleanedForSave = stripLegacySidebarBlocks(caseStudyContent || '');
    const updatedProject: ProjectData = {
      ...project,
      title: editedTitle,
      description: editedDescription,
      caseStudyContent: cleanedForSave,
      caseStudyImages: caseStudyImagesRef.current,
      flowDiagramImages: flowDiagramImagesRef.current,
      videoItems: videoItemsRef.current,
      galleryAspectRatio,
      flowDiagramAspectRatio,
      videoAspectRatio,
      galleryColumns,
      flowDiagramColumns,
      videoColumns,
      projectImagesPosition,
      videosPosition,
      flowDiagramsPosition,
      solutionCardsPosition,
      // Persist current sidebars from UI resolution
      caseStudySidebars: persistedSidebars,
      case_study_sidebars: persistedSidebars,
    };
    console.log('💾 [handleSave] Saving with', caseStudyImagesRef.current.length, 'project images,', videoItemsRef.current.length, 'videos and', flowDiagramImagesRef.current.length, 'flow diagrams');
    onUpdate(updatedProject);
    setIsEditing(false);
  };

  const handleAddImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          // Use placeholder URL instead of base64
          const url = await uploadImage(file, 'portrait');
          
          const newImage: CaseStudyImage = {
            id: Math.random().toString(36).substr(2, 9),
            url: url,
            alt: file.name,
            scale: 0.8, // Use smaller scale to prevent cropping
            position: { x: 50, y: 50 }
          };
          const updatedImages = [...caseStudyImages, newImage];
          setCaseStudyImages(updatedImages);
          
          // Always save immediately when adding images
          // CRITICAL: Use ref for flowDiagramImages to avoid stale state
          const persistedSidebars = buildPersistedSidebars();
          const cleanedForSave = stripLegacySidebarBlocks(caseStudyContent || '');
          const updatedProject: ProjectData = {
            ...project,
            title: editedTitle,
            description: editedDescription,
            caseStudyContent: cleanedForSave,
            caseStudyImages: updatedImages,
            flowDiagramImages: flowDiagramImagesRef.current,
            videoItems: videoItemsRef.current,
            galleryAspectRatio,
            flowDiagramAspectRatio,
            videoAspectRatio,
            galleryColumns,
            flowDiagramColumns,
            videoColumns,
            projectImagesPosition,
            videosPosition,
            flowDiagramsPosition,
            solutionCardsPosition,
            caseStudySidebars: persistedSidebars,
            case_study_sidebars: persistedSidebars,
          };
          console.log('📸 Adding new image to project:', {
            projectId: project.id,
            totalImages: updatedImages.length,
            newImageId: newImage.id,
            placeholderUrl: url
          });
          
          // Mark the project as having unsaved changes
          document.body.setAttribute('data-unsaved', 'true');
          console.log('📸 SET data-unsaved flag to true');
          
          // Force immediate save
          console.log('📸 FORCING IMMEDIATE SAVE due to image upload');
          onUpdate(updatedProject);
          
          // Clear the unsaved flag after a longer delay to ensure auto-save catches it
          setTimeout(() => {
            console.log('📸 CLEARING data-unsaved flag');
            document.body.removeAttribute('data-unsaved');
          }, 5000);
        } catch (error) {
          console.error('Error adding image:', error);
          alert('Failed to add image. Please try again.');
        }
      }
    };
    input.click();
  };

  const handleRemoveImage = (id: string) => {
    const updatedImages = caseStudyImages.filter((img) => img.id !== id);
    setCaseStudyImages(updatedImages);
    
    // Always save immediately when removing images
    // CRITICAL: Use ref for flowDiagramImages to avoid stale state
    const updatedProject: ProjectData = {
      ...project,
      title: editedTitle,
      description: editedDescription,
      caseStudyContent,
      caseStudyImages: updatedImages,
      flowDiagramImages: flowDiagramImagesRef.current,
      galleryAspectRatio,
      flowDiagramAspectRatio,
      galleryColumns,
      flowDiagramColumns,
      projectImagesPosition,
      flowDiagramsPosition,
      solutionCardsPosition,
    };
    console.log('🗑️ [handleRemoveImage] Removing image, saving with', updatedImages.length, 'project images');
    onUpdate(updatedProject);
  };

  const handleChangeHeroImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          // Upload to Supabase Storage instead of base64
          const newImageUrl = await uploadImage(file, 'hero');
          
          // New images default to 100% zoom, centered (for both detail and home views)
          // Use a smaller scale to prevent cropping issues
          const newScale = 0.8;
          const newPosition = { x: 50, y: 50 };
          
          // Update local display state
          setHeroScale(newScale);
          setHeroPosition(newPosition);
          
          // Mark the project as having unsaved changes
          document.body.setAttribute('data-unsaved', 'true');
          console.log('🖼️ SET data-unsaved flag to true for hero image');
          
          // CRITICAL: Use refs for image arrays to avoid stale state
          const updatedProject: ProjectData = {
            ...project,
            url: newImageUrl,
            scale: newScale, // This is for the home carousel
            position: newPosition, // This is for the home carousel
            title: editedTitle,
            description: editedDescription,
            caseStudyContent,
            caseStudyImages: caseStudyImagesRef.current,
            flowDiagramImages: flowDiagramImagesRef.current,
            galleryAspectRatio,
            flowDiagramAspectRatio,
            galleryColumns,
            flowDiagramColumns,
            projectImagesPosition,
            flowDiagramsPosition,
            solutionCardsPosition,
          };
            
            console.log('🖼️ ProjectDetail: Hero image changed, calling onUpdate with:', {
              id: updatedProject.id,
              newImageUrl: newImageUrl.substring(0, 50) + '...',
              scale: newScale,
              position: newPosition
            });
            
          // Force immediate save for hero image changes
          console.log('🖼️ FORCING IMMEDIATE SAVE for hero image upload');
          console.log('🖼️ Updated project data:', {
            id: updatedProject.id,
            title: updatedProject.title,
            url: updatedProject.url?.substring(0, 50) + '...',
            scale: updatedProject.scale,
            position: updatedProject.position
          });
          onUpdate(updatedProject);
          
          // Clear the unsaved flag after a delay
          setTimeout(() => {
            console.log('🖼️ CLEARING data-unsaved flag for hero image');
            document.body.removeAttribute('data-unsaved');
          }, 5000);
        } catch (error) {
          console.error('Error uploading hero image:', error);
          alert('Failed to upload image. Please try again.');
        }
      }
    };
    input.click();
  };

  // Update visual order during drag (no auto-save)
  const moveImage = (dragIndex: number, hoverIndex: number) => {
    setCaseStudyImages(prevImages => {
      const updatedImages = [...prevImages];
      const [draggedImage] = updatedImages.splice(dragIndex, 1);
      updatedImages.splice(hoverIndex, 0, draggedImage);
      return updatedImages;
    });
  };
  
  // Save changes and navigate back
  const handleSaveAndBack = () => {
    // CRITICAL: Use refs for image arrays to avoid stale state
    const persistedSidebars = buildPersistedSidebars();
    const cleanedForSave = stripLegacySidebarBlocks(caseStudyContent || '');
    const updatedProject: ProjectData = {
      ...project,
      title: editedTitle,
      description: editedDescription,
      caseStudyContent: cleanedForSave,
      caseStudyImages: caseStudyImagesRef.current,
      flowDiagramImages: flowDiagramImagesRef.current,
      videoItems: videoItemsRef.current,
      galleryAspectRatio,
      flowDiagramAspectRatio,
      videoAspectRatio,
      galleryColumns,
      flowDiagramColumns,
      videoColumns,
      projectImagesPosition,
      videosPosition,
      flowDiagramsPosition,
      solutionCardsPosition,
      caseStudySidebars: persistedSidebars,
      case_study_sidebars: persistedSidebars,
    };
    
    console.log('💾 [handleSaveAndBack] Saving all changes synchronously before navigation:', {
      imageCount: caseStudyImagesRef.current.length,
      imageIds: caseStudyImagesRef.current.map(img => img.id)
    });
    
    // Save synchronously DIRECTLY to localStorage (bypass React state updates)
    try {
      const caseStudiesData = localStorage.getItem('caseStudies');
      const designProjectsData = localStorage.getItem('designProjects');
      
      if (caseStudiesData) {
        const caseStudies = JSON.parse(caseStudiesData);
        const updatedCaseStudies = caseStudies.map((p: ProjectData) =>
          p.id === project.id ? updatedProject : p
        );
        localStorage.setItem('caseStudies', JSON.stringify(updatedCaseStudies));
        console.log('✅ Saved directly to localStorage');
      } else if (designProjectsData) {
        const designProjects = JSON.parse(designProjectsData);
        const updatedDesignProjects = designProjects.map((p: ProjectData) =>
          p.id === project.id ? updatedProject : p
        );
        localStorage.setItem('designProjects', JSON.stringify(updatedDesignProjects));
        console.log('✅ Saved directly to localStorage');
      }
    } catch (e) {
      console.error('Failed to save directly to localStorage:', e);
    }
    
    // Also call onUpdate for React state updates (but don't wait for it)
    onUpdate(updatedProject);
    
    // Navigate immediately (localStorage write is already complete)
    onBack();
  };
  
  // Cancel editing - discard changes and go back
  const handleCancelEditing = () => {
    // Restore original content
    setCaseStudyContent(originalContent);
    setIsEditing(false);
  };
  
  // Navigate back without forcing save (for Cancel button and back navigation in preview mode)
  const handleBack = () => {
    // If in edit mode and editing, ask for confirmation
    if (isEditMode && isEditing && caseStudyContent !== originalContent) {
      if (!confirm('You have unsaved changes. Do you want to leave without saving?')) {
        return;
      }
    }
    
    // Navigate without saving
    onBack();
  };
  
  // No-op for drag end
  const handleDragEnd = () => {
    // Don't save on drag end - save happens when clicking Back
  };

  const handleImageUpdate = (id: string, updates: Partial<CaseStudyImage>) => {
    setCaseStudyImages(prevImages =>
      prevImages.map(img => img.id === id ? { ...img, ...updates } : img)
    );
    // Don't auto-save - save happens when clicking Back or Done button
  };

  // Hero image positioning is completely independent - no auto-save needed
  // The hero image positioning only affects the case study detail screen
  // Home screen positioning remains separate and controlled by project.position/project.scale

  const handleHeroMouseDown = (e: any) => {
    if (!isEditingHeroImage) return;
    e.stopPropagation();
    setIsDraggingHero(true);
  };

  const handleHeroMouseMove = (e: any) => {
    if (!isDraggingHero || !heroImageRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    
    const rect = heroImageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    
    setHeroPosition({ x, y });
  };

  const handleHeroMouseUp = () => {
    setIsDraggingHero(false);
  };

  const handleMoveProjectImages = (direction: 'up' | 'down') => {
    const currentPos = projectImagesPosition ?? 2; // Default to position 2 if undefined
    const targetPos = direction === 'up' ? currentPos - 1 : currentPos + 1;
    
    // Don't move if at boundary
    if (direction === 'up' && currentPos <= 0) return;
    if (direction === 'down' && currentPos >= totalSections - 1) return;
    
    // Find what section is at the target position and swap with it
    let newProjectImagesPos = targetPos;
    let newVideosPos = videosPosition;
    let newFlowDiagramsPos = flowDiagramsPosition;
    let newSolutionCardsPos = solutionCardsPosition;
    
    // Check if another gallery section is at the target position
    if (videosPosition === targetPos) {
      // Swap with Videos
      newVideosPos = currentPos;
      newProjectImagesPos = targetPos;
    } else if (flowDiagramsPosition === targetPos) {
      // Swap with Flow Diagrams
      newFlowDiagramsPos = currentPos;
      newProjectImagesPos = targetPos;
    } else if (solutionCardsPosition === targetPos) {
      // Swap with Solution Cards
      newSolutionCardsPos = currentPos;
      newProjectImagesPos = targetPos;
    } else {
      // Target position is occupied by a regular markdown section
      // For now, just move the project images to that position
      // TODO: Implement proper section swapping in the future
      newProjectImagesPos = targetPos;
    }
    
    console.log(`📦 Moving Project Images: ${currentPos} → ${targetPos}`);
    
    setProjectImagesPosition(newProjectImagesPos);
    setVideosPosition(newVideosPos);
    setFlowDiagramsPosition(newFlowDiagramsPos);
    setSolutionCardsPosition(newSolutionCardsPos);
    
    const updatedProject: ProjectData = {
      ...project,
      title: editedTitle,
      description: editedDescription,
      caseStudyContent,
      caseStudyImages: caseStudyImagesRef.current,
      flowDiagramImages: flowDiagramImagesRef.current,
      videoItems: videoItemsRef.current,
      galleryAspectRatio,
      flowDiagramAspectRatio,
      videoAspectRatio,
      galleryColumns,
      flowDiagramColumns,
      videoColumns,
      projectImagesPosition: newProjectImagesPos,
      videosPosition: newVideosPos,
      flowDiagramsPosition: newFlowDiagramsPos,
      solutionCardsPosition: newSolutionCardsPos,
    };
    onUpdate(updatedProject);
  };

  const handleMoveVideos = (direction: 'up' | 'down') => {
    const currentPos = videosPosition;
    const targetPos = direction === 'up' ? currentPos - 1 : currentPos + 1;
    
    // Don't move if at boundary
    if (direction === 'up' && currentPos === 0) return;
    
    // Find what section is at the target position and swap with it
    let newProjectImagesPos = projectImagesPosition;
    let newVideosPos = targetPos;
    let newFlowDiagramsPos = flowDiagramsPosition;
    let newSolutionCardsPos = solutionCardsPosition;
    
    // Check if another gallery section is at the target position
    if (projectImagesPosition === targetPos) {
      // Swap with Project Images
      newProjectImagesPos = currentPos;
      newVideosPos = targetPos;
    } else if (flowDiagramsPosition === targetPos) {
      // Swap with Flow Diagrams
      newFlowDiagramsPos = currentPos;
      newVideosPos = targetPos;
    } else if (solutionCardsPosition === targetPos) {
      // Swap with Solution Cards
      newSolutionCardsPos = currentPos;
      newVideosPos = targetPos;
    } else {
      // Target position is occupied by a regular markdown section
      // Just move the videos to that position
      // The markdown section will automatically shift down
      newVideosPos = targetPos;
    }
    
    console.log(`📹 Moving Videos: ${currentPos} → ${targetPos}`);
    
    setProjectImagesPosition(newProjectImagesPos);
    setVideosPosition(newVideosPos);
    setFlowDiagramsPosition(newFlowDiagramsPos);
    setSolutionCardsPosition(newSolutionCardsPos);
    
    const updatedProject: ProjectData = {
      ...project,
      title: editedTitle,
      description: editedDescription,
      caseStudyContent,
      caseStudyImages: caseStudyImagesRef.current,
      flowDiagramImages: flowDiagramImagesRef.current,
      videoItems: videoItemsRef.current,
      galleryAspectRatio,
      flowDiagramAspectRatio,
      videoAspectRatio,
      galleryColumns,
      flowDiagramColumns,
      videoColumns,
      projectImagesPosition: newProjectImagesPos,
      videosPosition: newVideosPos,
      flowDiagramsPosition: newFlowDiagramsPos,
      solutionCardsPosition: newSolutionCardsPos,
    };
    onUpdate(updatedProject);
  };

  const handleMoveFlowDiagrams = (direction: 'up' | 'down') => {
    const currentPos = flowDiagramsPosition;
    const targetPos = direction === 'up' ? currentPos - 1 : currentPos + 1;
    
    // Don't move if at boundary
    if (direction === 'up' && currentPos === 0) return;
    
    // Find what section is at the target position and swap with it
    let newProjectImagesPos = projectImagesPosition;
    let newVideosPos = videosPosition;
    let newFlowDiagramsPos = targetPos;
    let newSolutionCardsPos = solutionCardsPosition;
    
    // Check if another gallery section is at the target position
    if (projectImagesPosition === targetPos) {
      // Swap with Project Images
      newProjectImagesPos = currentPos;
      newFlowDiagramsPos = targetPos;
    } else if (videosPosition === targetPos) {
      // Swap with Videos
      newVideosPos = currentPos;
      newFlowDiagramsPos = targetPos;
    } else if (solutionCardsPosition === targetPos) {
      // Swap with Solution Cards
      newSolutionCardsPos = currentPos;
      newFlowDiagramsPos = targetPos;
    } else {
      // Target position is occupied by a regular markdown section
      // Just move the flow diagrams to that position
      // The markdown section will automatically shift down
      newFlowDiagramsPos = targetPos;
    }
    
    console.log(`📊 Moving Flow Diagrams: ${currentPos} → ${targetPos}`);
    
    setProjectImagesPosition(newProjectImagesPos);
    setVideosPosition(newVideosPos);
    setFlowDiagramsPosition(newFlowDiagramsPos);
    setSolutionCardsPosition(newSolutionCardsPos);
    
    const updatedProject: ProjectData = {
      ...project,
      title: editedTitle,
      description: editedDescription,
      caseStudyContent,
      caseStudyImages: caseStudyImagesRef.current,
      flowDiagramImages: flowDiagramImagesRef.current,
      videoItems: videoItemsRef.current,
      galleryAspectRatio,
      flowDiagramAspectRatio,
      videoAspectRatio,
      galleryColumns,
      flowDiagramColumns,
      videoColumns,
      projectImagesPosition: newProjectImagesPos,
      videosPosition: newVideosPos,
      flowDiagramsPosition: newFlowDiagramsPos,
      solutionCardsPosition: newSolutionCardsPos,
    };
    onUpdate(updatedProject);
  };

  const handleMoveSolutionCards = (direction: 'up' | 'down') => {
    const currentPos = solutionCardsPosition;
    const targetPos = direction === 'up' ? currentPos - 1 : currentPos + 1;
    
    console.log(`🎴 Attempting to move Solution Cards ${direction}: ${currentPos} → ${targetPos}`);
    
    // Don't move if at boundary
    if (direction === 'up' && currentPos === 0) {
      console.log(`⚠️ Can't move up - already at top`);
      return;
    }
    
    // Find what section is at the target position and swap with it
    let newProjectImagesPos = projectImagesPosition;
    let newVideosPos = videosPosition;
    let newFlowDiagramsPos = flowDiagramsPosition;
    let newSolutionCardsPos = targetPos;
    
    if (projectImagesPosition === targetPos) {
      // Swap with Project Images
      console.log(`↔️ Swapping Solution Cards with Project Images`);
      newProjectImagesPos = currentPos;
      newSolutionCardsPos = targetPos;
    } else if (videosPosition === targetPos) {
      // Swap with Videos
      console.log(`↔️ Swapping Solution Cards with Videos`);
      newVideosPos = currentPos;
      newSolutionCardsPos = targetPos;
    } else if (flowDiagramsPosition === targetPos) {
      // Swap with Flow Diagrams
      console.log(`↔️ Swapping Solution Cards with Flow Diagrams`);
      newFlowDiagramsPos = currentPos;
      newSolutionCardsPos = targetPos;
    } else {
      // Moving past a markdown section - just increment/decrement
      console.log(`📝 Moving past markdown section at position ${targetPos}`);
      newSolutionCardsPos = targetPos;
    }
    
    console.log(`✅ New positions:`, {
      projectImages: newProjectImagesPos,
      videos: newVideosPos,
      flowDiagrams: newFlowDiagramsPos,
      solutionCards: newSolutionCardsPos
    });
    
    setProjectImagesPosition(newProjectImagesPos);
    setVideosPosition(newVideosPos);
    setFlowDiagramsPosition(newFlowDiagramsPos);
    setSolutionCardsPosition(newSolutionCardsPos);
    
    const updatedProject: ProjectData = {
      ...project,
      title: editedTitle,
      description: editedDescription,
      caseStudyContent,
      caseStudyImages: caseStudyImagesRef.current,
      flowDiagramImages: flowDiagramImagesRef.current,
      videoItems: videoItemsRef.current,
      galleryAspectRatio,
      flowDiagramAspectRatio,
      videoAspectRatio,
      galleryColumns,
      flowDiagramColumns,
      videoColumns,
      projectImagesPosition: newProjectImagesPos,
      videosPosition: newVideosPos,
      flowDiagramsPosition: newFlowDiagramsPos,
      solutionCardsPosition: newSolutionCardsPos,
    };
    onUpdate(updatedProject);
  };

  // Simplified markdown section move handler
  const handleMoveMarkdownSection = (sectionTitle: string, direction: 'up' | 'down') => {
    console.log(`📝 Moving markdown section "${sectionTitle}" ${direction}`);
    
    // Build the combined sections list to find actual positions
    const lines = caseStudyContent?.split('\n') || [];
    const markdownSections: Array<{ title: string; startLine: number; endLine: number }> = [];
    
    // Find all markdown section boundaries
    for (let i = 0; i < lines.length; i++) {
      const headerMatch = lines[i].match(/^#{1,2} (.+)$/);
      if (headerMatch) {
        const title = headerMatch[1].trim();
        markdownSections.push({ title, startLine: i, endLine: -1 });
        
        if (markdownSections.length > 1) {
          markdownSections[markdownSections.length - 2].endLine = i - 1;
        }
      }
    }
    
    if (markdownSections.length > 0) {
      markdownSections[markdownSections.length - 1].endLine = lines.length - 1;
    }
    
    console.log('📋 Markdown sections found:', markdownSections.map(s => s.title));
    
    // Build combined list with positions (same logic as CaseStudySections)
    const combined: Array<{ title: string; type: 'markdown' | 'special'; position: number }> = [];
    let markdownIndex = 0;
    
    for (let i = 0; i < 20; i++) { // Max 20 positions
      // Check if Project Images is at this position
      if (projectImagesPosition === i && (caseStudyImages.length > 0 || isEditMode)) {
        combined.push({ title: '__PROJECT_IMAGES__', type: 'special', position: i });
        continue;
      }
      
      // Check if Flow Diagrams is at this position
      if (flowDiagramsPosition === i && (flowDiagramImages.length > 0 || isEditMode)) {
        combined.push({ title: '__FLOW_DIAGRAMS__', type: 'special', position: i });
        continue;
      }
      
      // Check if Solution Cards is at this position
      if (solutionCardsPosition !== undefined && solutionCardsPosition === i) {
        combined.push({ title: '__SOLUTION_CARDS__', type: 'special', position: i });
        continue;
      }
      
      // Otherwise, add next markdown section if available
      if (markdownIndex < markdownSections.length) {
        combined.push({ 
          title: markdownSections[markdownIndex].title, 
          type: 'markdown', 
          position: i 
        });
        markdownIndex++;
      }
    }
    
    console.log('📋 Combined sections:', combined.map(c => `${c.title} (${c.type}) @${c.position}`));
    
    // Find current section in combined list
    const currentIndex = combined.findIndex(c => c.title === sectionTitle);
    if (currentIndex === -1) {
      console.error('❌ Section not found in combined list');
      return;
    }
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Check boundaries
    if (targetIndex < 0 || targetIndex >= combined.length) {
      console.log('⚠️ Already at boundary');
      return;
    }
    
    const current = combined[currentIndex];
    const target = combined[targetIndex];
    
    console.log(`↔️ Swapping "${current.title}" (${current.type}) with "${target.title}" (${target.type})`);
    
    if (target.type === 'special') {
      // Move the special section to make room for the markdown section
      console.log('🔄 Moving special section to make room for markdown section');
      
      if (target.title === '__PROJECT_IMAGES__') {
        // Move project images to the next available position
        const newProjectImagesPos = direction === 'up' ? projectImagesPosition - 1 : projectImagesPosition + 1;
        setProjectImagesPosition(newProjectImagesPos);
        
        // Update the project
        const updatedProject: ProjectData = {
          ...project,
          title: editedTitle,
          description: editedDescription,
          caseStudyContent,
          caseStudyImages: caseStudyImagesRef.current,
          flowDiagramImages: flowDiagramImagesRef.current,
          videoItems: videoItemsRef.current,
          galleryAspectRatio,
          flowDiagramAspectRatio,
          videoAspectRatio,
          galleryColumns,
          flowDiagramColumns,
          videoColumns,
          projectImagesPosition: newProjectImagesPos,
          videosPosition,
          flowDiagramsPosition,
          solutionCardsPosition,
          sectionPositions,
        };
        onUpdate(updatedProject);
        return;
      }
      
      // For other special sections, just allow the movement
      console.log('✅ Allowing movement past special section');
    }
    
    // Swapping with another markdown section - update markdown content
    const currentSection = markdownSections.find(s => s.title === sectionTitle);
    const targetSection = markdownSections.find(s => s.title === target.title);
      
      if (!currentSection || !targetSection) {
        console.error('❌ Sections not found in markdown');
        return;
      }
      
      // Extract section content
      const currentLines = lines.slice(currentSection.startLine, currentSection.endLine + 1);
      const targetLines = lines.slice(targetSection.startLine, targetSection.endLine + 1);
      
      // Rebuild content with swapped sections
      const newLines = direction === 'up' ? [
        ...lines.slice(0, targetSection.startLine),
        ...currentLines,
        ...targetLines,
        ...lines.slice(currentSection.endLine + 1)
      ] : [
        ...lines.slice(0, currentSection.startLine),
        ...targetLines,
        ...currentLines,
        ...lines.slice(targetSection.endLine + 1)
      ];
      
      const newContent = newLines.join('\n');
      console.log('✅ Markdown content updated');
      setCaseStudyContent(newContent);
      
      const updatedProject: ProjectData = {
        ...project,
        title: editedTitle,
        description: editedDescription,
        caseStudyContent: newContent,
        caseStudyImages: caseStudyImagesRef.current,
        flowDiagramImages: flowDiagramImagesRef.current,
      videoItems: videoItemsRef.current,
        galleryAspectRatio,
        flowDiagramAspectRatio,
      videoAspectRatio,
        galleryColumns,
        flowDiagramColumns,
      videoColumns,
        projectImagesPosition,
      videosPosition,
        flowDiagramsPosition,
        solutionCardsPosition,
      sectionPositions,
      };
      onUpdate(updatedProject);
  };

  // OLD: Universal section move handler - works for ANY section
  const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
    const currentPos = sectionPositions[sectionId];
    if (currentPos === undefined) {
      console.error(`Section ${sectionId} not found in positions`);
      return;
    }
    
    const targetPos = direction === 'up' ? currentPos - 1 : currentPos + 1;
    
    // Find all sections to get boundaries
    const allPositions = Object.values(sectionPositions) as number[];
    const minPos = Math.min(...allPositions);
    const maxPos = Math.max(...allPositions);
    
    // Don't move if at boundary
    if (targetPos < minPos || targetPos > maxPos) {
      console.log(`Cannot move ${sectionId} ${direction} - at boundary`);
      return;
    }
    
    // Find what section is at the target position
    const targetSectionId = Object.keys(sectionPositions).find(
      id => sectionPositions[id] === targetPos
    );
    
    if (!targetSectionId) {
      console.error(`No section found at position ${targetPos}`);
      return;
    }
    
    console.log(`🔄 Swapping "${sectionId}" (${currentPos}) ↔ "${targetSectionId}" (${targetPos})`);
    
    // Swap the two sections
    const newPositions = {
      ...sectionPositions,
      [sectionId]: targetPos,
      [targetSectionId]: currentPos
    };
    
    setSectionPositions(newPositions);
    
    // Auto-save
    const updatedProject: ProjectData = {
      ...project,
      title: editedTitle,
      description: editedDescription,
      caseStudyContent,
      caseStudyImages: caseStudyImagesRef.current,
      flowDiagramImages: flowDiagramImagesRef.current,
      galleryAspectRatio,
      flowDiagramAspectRatio,
      galleryColumns,
      flowDiagramColumns,
      projectImagesPosition,
      flowDiagramsPosition,
      solutionCardsPosition,
      sectionPositions: newPositions,
    };
    onUpdate(updatedProject);
  };

  // Handler for updating first sidebar section (At a glance)
  const handleUpdateAtAGlance = (title: string, content: string) => {
    // JSON authoritative update
    const normalizedContent = (content || '').replace(/^#\s+.*\n?/, '').trim();
    const updatedSidebars = {
      ...((project as any).caseStudySidebars || (project as any).case_study_sidebars || {}),
      atGlance: { title: title || 'Sidebar 1', content: normalizedContent, hidden: false }
    } as any;

    const updatedSectionPositions = {
      ...(sectionPositions as any) || (project as any)?.sectionPositions || {},
      hideAtAGlance: false
    } as any;

    onUpdate({
      ...project,
      sectionPositions: updatedSectionPositions,
      section_positions: updatedSectionPositions,
      caseStudySidebars: updatedSidebars,
      case_study_sidebars: updatedSidebars
    } as any);
  };

  // Handler for updating second sidebar section (Impact) – persist immediately
  const handleUpdateImpact = (title: string, content: string) => {
    const normalizedContent = (content || '').replace(/^#\s+.*\n?/, '').trim();

    // Replace or append a single "# Impact" block using exact title match
    const lines = (caseStudyContent || '').split('\n');
    const newLines: string[] = [];
    let i = 0;
    let replaced = false;

    while (i < lines.length) {
      const line = lines[i];
      if (line.trim() === '# Impact') {
            newLines.push(`# ${title}`);
        if (normalizedContent) newLines.push(normalizedContent);
        i++;
        while (i < lines.length && !lines[i].trim().match(/^#\s+.+$/)) i++;
        replaced = true;
          continue;
        }
      newLines.push(line);
      i++;
    }

    if (!replaced) {
      if (newLines.length && newLines[newLines.length - 1].trim() !== '') newLines.push('');
      newLines.push(`# ${title}`);
      if (normalizedContent) newLines.push(normalizedContent);
    }
    
    const newContent = newLines.join('\n');
    setCaseStudyContent(newContent);
    
    // Immediately persist: clear hideImpact and save sidebars JSON
    const updatedSectionPositions = {
      ...(sectionPositions as any) || (project as any)?.sectionPositions || {},
      hideImpact: false
    } as any;

    const updatedSidebars = {
      ...((project as any).caseStudySidebars || (project as any).case_study_sidebars || {}),
      impact: { title, content: normalizedContent, hidden: false }
    } as any;

    onUpdate({
      ...project,
      title: editedTitle,
      description: editedDescription,
      caseStudyContent: newContent,
      caseStudyImages: caseStudyImagesRef.current,
      flowDiagramImages: flowDiagramImagesRef.current,
      videoItems: videoItemsRef.current,
      galleryAspectRatio,
      flowDiagramAspectRatio,
      videoAspectRatio,
      galleryColumns,
      flowDiagramColumns,
      videoColumns,
      projectImagesPosition,
      videosPosition,
      flowDiagramsPosition,
      solutionCardsPosition,
      sectionPositions: updatedSectionPositions,
      section_positions: updatedSectionPositions,
      caseStudySidebars: updatedSidebars,
      case_study_sidebars: updatedSidebars
    });
  };

  // Handler for removing first sidebar section (At a glance)
  const handleRemoveAtAGlance = () => {
    if (!confirm('Are you sure you want to remove this sidebar section?\n\nThis action cannot be undone.')) {
      return;
    }
    
    // Remove the first sidebar section from the markdown content
    const lines = caseStudyContent?.split('\n') || [];
    const newLines: string[] = [];
    let inSidebarSection = false;
    let foundSidebarSection = false;
    let sectionCount = 0;
    
    for (const line of lines) {
      const topLevelMatch = line.trim().match(/^# (.+)$/);
      
      if (topLevelMatch) {
        const sectionTitle = topLevelMatch[1].trim();
        
        // If we were in a sidebar section, stop skipping
        if (inSidebarSection) {
          inSidebarSection = false;
        }
        
        // Count non-Overview sections
        if (sectionTitle !== "Overview") {
          sectionCount++;
          
          // First non-Overview section is the sidebar section
          if (sectionCount === 1) {
            foundSidebarSection = true;
            inSidebarSection = true;
            continue; // Skip the header line
          }
        }
      }
      
      // Only keep lines that are not in the sidebar section
      if (!inSidebarSection) {
        newLines.push(line);
      }
    }
    
    const updatedContent = newLines.join('\n');
    setCaseStudyContent(updatedContent);
    
    const updatedSectionPositions = {
      ...(project as any)?.sectionPositions,
      hideAtAGlance: true
    };
    const updatedProject = {
      ...project,
      case_study_content: updatedContent,
      section_positions: updatedSectionPositions,
      sectionPositions: updatedSectionPositions
    } as any;
    onUpdate(updatedProject);
  };

  // Handler for removing Impact sidebar (flexible to handle renamed sections)
  const handleRemoveImpact = () => {
    if (!confirm('Are you sure you want to remove this Impact section?\n\nThis action cannot be undone.')) {
      return;
    }
    
    // Remove the '# Impact' section by exact header match
    const lines = caseStudyContent?.split('\n') || [];
    const newLines: string[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.trim() === '# Impact') {
        i++;
        // Skip until next top-level header
        while (i < lines.length && !lines[i].trim().match(/^#\s+.+$/)) i++;
        continue;
      }
        newLines.push(line);
      i++;
    }
    
    const updatedContent = newLines.join('\n');
    setCaseStudyContent(updatedContent);
    
    // Persist hide flag and clear JSON sidebar for impact
    const updatedSectionPositions = {
      ...(project as any)?.sectionPositions,
      hideImpact: true
    };

    const updatedSidebars = {
      ...((project as any).caseStudySidebars || (project as any).case_study_sidebars || {}),
      impact: { title: 'Impact', content: '', hidden: true }
    } as any;

    onUpdate({
      ...project,
      case_study_content: updatedContent,
      caseStudyContent: updatedContent,
      section_positions: updatedSectionPositions,
      sectionPositions: updatedSectionPositions,
      caseStudySidebars: updatedSidebars,
      case_study_sidebars: updatedSidebars
    } as any);
  };

  // Memoize expensive position calculations to prevent timeout
  const { actualPositions, totalSections } = useMemo(() => {
    console.log('🔄 Calculating actualPositions and totalSections...');
    
    // When JSON sidebars exist, ONLY parse explicitly whitelisted sections (prevents legacy sidebar content from becoming cards)
    // Check both local state and project prop (in case local state hasn't synced yet on initial load)
    const projectSidebars = (project as any).caseStudySidebars || (project as any).case_study_sidebars || {};
    const hasJsonSidebars = Boolean((caseStudySidebars as any)?.atGlance) || Boolean((caseStudySidebars as any)?.impact) ||
                            Boolean(projectSidebars?.atGlance) || Boolean(projectSidebars?.impact);
    
    // Parse sections once
    const lines = cleanedContent?.split('\n') || [];
    const excludedSidebarTitles = [
      'Sidebar 1', 'Sidebar 2', 'At a glance', 'Impact', 'Tech stack', 'Tools'
    ];
    
    // Strict whitelist of legitimate section titles (only these are allowed when JSON sidebars exist)
    const whitelistedSections = [
      'Overview', 'The challenge', 'My role', 'My role & impact', 'Research insights', 
      'Competitive analysis', 'The solution', 'Solution cards', 'Key features'
    ];
    
    let sections: string[] = [];
    
    // If JSON sidebars exist, ONLY parse whitelisted sections - ignore everything else
    if (hasJsonSidebars) {
      sections = lines
        .filter(line => (line || '').trim().match(/^# (.+)$/))
        .map(line => (line || '').trim().substring(2).trim())
        .filter(title => {
          // Exclude sidebar titles
          if (excludedSidebarTitles.includes(title)) return false;
          // ONLY include if it's in the whitelist (case-insensitive, exact or contains match)
          const t = title.toLowerCase();
          const isWhitelisted = whitelistedSections.some(w => {
            const wLower = w.toLowerCase();
            return t === wLower || t.startsWith(wLower + ' ') || t.includes(wLower);
          });
          if (!isWhitelisted) {
            console.log('🚫 Excluding non-whitelisted section (JSON sidebars exist):', title);
          }
          return isWhitelisted;
        });
    } else {
      // No JSON sidebars - parse all sections (legacy behavior)
      sections = lines
        .filter(line => (line || '').trim().match(/^# (.+)$/))
        .map(line => (line || '').trim().substring(2).trim())
        .filter(title => !excludedSidebarTitles.includes(title));
    }
    const decorativeCardSections = ["Overview", "My role", "Research insights", "Competitive analysis"];
    
    // Build base items
    const items: Array<{ title: string; type: string }> = sections.filter(title => {
      // Exclude any sidebar headers from being treated as narrative sections
      const t = title.toLowerCase();
      if (t === 'at a glance' || t === 'impact' || t === 'sidebar 1' || t === 'sidebar 2' || t === 'tech stack' || t === 'tools') return false;
      const isDecorative = decorativeCardSections.some(dec => title.toLowerCase().includes(dec.toLowerCase()));
      const isSolution = title.toLowerCase().includes("solution");
      return isDecorative || isSolution;
    }).map(s => ({ title: s, type: 'section' }));
    
    // Collect insertions
    const insertions: Array<{ pos: number; item: { title: string; type: string } }> = [];
    
    if (caseStudyImages.length > 0 || isEditMode) {
      insertions.push({ 
        pos: projectImagesPosition, 
        item: { title: '__PROJECT_IMAGES__', type: 'gallery' }
      });
    }
    
    if (videoItems.length > 0 || isEditMode) {
      insertions.push({ 
        pos: videosPosition, 
        item: { title: '__VIDEOS__', type: 'gallery' }
      });
    }
    
    if (flowDiagramImages.length > 0 || isEditMode) {
      insertions.push({ 
        pos: flowDiagramsPosition, 
        item: { title: '__FLOW_DIAGRAMS__', type: 'gallery' }
      });
    }
    
    // Only insert Solution Cards when EXPLICITLY added via UI (solutionCardsPosition is set)
    // OR when there's an explicit "Solution cards" section (not just "The solution")
    const hasExplicitSolutionCards = sections.some(title => {
      const t = title.toLowerCase();
      return t === 'solution cards' || t.startsWith('solution cards:');
    });
    
    console.log('🔍 Solution Cards Debug:', {
      hasExplicitSolutionCards,
      isEditMode,
      solutionCardsPosition,
      sections: sections,
      hasJsonSidebars,
      shouldInsert: (hasExplicitSolutionCards || (isEditMode && solutionCardsPosition !== undefined)) && solutionCardsPosition !== undefined
    });
    
    // Only insert if explicitly added via UI OR if there's an explicit "Solution cards" section
    if ((hasExplicitSolutionCards || (isEditMode && solutionCardsPosition !== undefined)) && solutionCardsPosition !== undefined) {
      console.log('🎴 Inserting Solution Cards at position:', solutionCardsPosition);
      insertions.push({ 
        pos: solutionCardsPosition, 
        item: { title: '__SOLUTION_CARDS__', type: 'gallery' }
      });
    }
    
    // Sort descending (highest first) to avoid index shifting
    insertions.sort((a, b) => b.pos - a.pos);
    
    // Insert in descending order
    for (const insertion of insertions) {
      items.splice(Math.min(insertion.pos, items.length), 0, insertion.item);
    }
    
    // Find actual indices
    const projectImagesActual = items.findIndex(item => item.title === '__PROJECT_IMAGES__');
    const videosActual = items.findIndex(item => item.title === '__VIDEOS__');
    const flowDiagramsActual = items.findIndex(item => item.title === '__FLOW_DIAGRAMS__');
    const solutionCardsActual = items.findIndex(item => item.title === '__SOLUTION_CARDS__');
    
    console.log('✅ Calculated positions:', {
      projectImages: projectImagesActual,
      videos: videosActual,
      flowDiagrams: flowDiagramsActual,
      solutionCards: solutionCardsActual,
      total: items.length
    });
    
    return {
      actualPositions: {
        projectImages: projectImagesActual,
        videos: videosActual,
        flowDiagrams: flowDiagramsActual,
        solutionCards: solutionCardsActual,
        total: items.length
      },
      totalSections: items.length
    };
  }, [
    cleanedContent, // Use cleanedContent, not caseStudyContent
    caseStudySidebars, // Recalculate when JSON sidebars change
    project, // Include project so it recalculates when project prop changes (e.g., on hard refresh)
    caseStudyImages.length,
    videoItems.length,
    flowDiagramImages.length,
    projectImagesPosition,
    videosPosition,
    flowDiagramsPosition,
    solutionCardsPosition,
    isEditMode
  ]);

  return (
    <PageLayout 
      title={project.title}
      subtitle={project.description || ''}
      onBack={handleBack} 
      overline={project.title ? undefined : undefined}
    >
      {/* Editable Title and Description */}
      {isEditMode && (
        <div className="mb-12 px-6 py-4" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Project Title</label>
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Project Description</label>
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full"
                rows={3}
              />
            </div>
          </div>
        </div>
      )}
      
      {isEditMode && (
        <div className="mb-10 px-6 pt-2" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="flex flex-wrap gap-4 items-center">
          <div className="text-sm font-medium">Add:</div>

          {/* Galleries dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full flex items-center gap-1">
                Galleries
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Galleries</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={videosPosition !== undefined} onClick={handleAddVideosSection}>Videos</DropdownMenuItem>
              <DropdownMenuItem disabled={projectImagesPosition !== undefined} onClick={handleAddImagesSection}>Project Images</DropdownMenuItem>
              <DropdownMenuItem disabled={flowDiagramsPosition !== undefined} onClick={handleAddFlowsSection}>Flow Diagrams</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Content dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full flex items-center gap-1">
                Content
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Content</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={hasMarkdownTitle('Overview')} onClick={handleAddOverviewSection}>Overview</DropdownMenuItem>
              <DropdownMenuItem disabled={hasMarkdownTitle('The challenge')} onClick={() => addMarkdownSection('The challenge', 'Describe the problem or challenge you were solving.')}>The challenge</DropdownMenuItem>
              <DropdownMenuItem disabled={hasMarkdownTitle('My role & impact')} onClick={() => addMarkdownSection('My role & impact', 'Describe your role and impact.')}>My role & impact</DropdownMenuItem>
              <DropdownMenuItem disabled={hasMarkdownTitle('Research insights')} onClick={() => addMarkdownSection('Research insights', 'Add your key research insights here.')}>Research insights</DropdownMenuItem>
              <DropdownMenuItem disabled={hasMarkdownTitle('Competitive analysis')} onClick={() => addMarkdownSection('Competitive analysis', 'Add your competitive analysis here.')}>Competitive analysis</DropdownMenuItem>
              <DropdownMenuItem disabled={hasMarkdownTitle('The solution')} onClick={() => addMarkdownSection('The solution', 'Describe your solution and approach.')}>The solution</DropdownMenuItem>
              <DropdownMenuItem disabled={hasMarkdownTitle('Key features')} onClick={() => addMarkdownSection('Key features', 'List key features and their impact.')}>Key features</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={solutionCardsPosition !== undefined} onClick={handleAddSolutionCardsSection}>Solution Cards</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sidebars dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full flex items-center gap-1">
                Sidebars
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Sidebars</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={!!atGlanceContent} onClick={() => addMarkdownSection('Sidebar 1', 'Add quick project facts here.')}>Sidebar 1</DropdownMenuItem>
              <DropdownMenuItem disabled={!!impactContent} onClick={() => addMarkdownSection('Sidebar 2', 'Describe outcomes or results here.')}>Sidebar 2</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      )}
      <div 
        className={(atGlanceContent || impactContent) ? "space-y-16 lg:grid lg:grid-cols-[1fr_320px] lg:gap-16 lg:space-y-0" : "space-y-16"}
        style={{
          ...((atGlanceContent || impactContent) && {
            display: 'block',
            maxWidth: '100%',
            margin: '0 auto',
            paddingLeft: '24px',
            paddingRight: '24px'
          })
        }}
        data-desktop-grid={atGlanceContent || impactContent ? 'true' : 'false'}
      >
        
        {/* Main Content Container */}
        <div className="space-y-16 lg:col-start-1 lg:col-end-1">
        {/* Hero Image Section - Order 2 on mobile (after sidebars) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative px-4 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-4 bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-purple-50/40 dark:from-slate-900/20 dark:via-blue-900/10 dark:to-purple-900/10 backdrop-blur-sm rounded-3xl border border-border shadow-2xl overflow-hidden group order-2 lg:order-none"
          style={{ marginTop: '60px' }}
        >
          <div 
            ref={heroImageRef}
            className="aspect-video overflow-hidden rounded-2xl shadow-2xl relative"
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 25%, #3b82f6 50%, #06b6d4 75%, #fbbf24 100%)',
              cursor: isEditingHeroImage ? 'crosshair' : 'pointer'
            }}
            onClick={() => !isEditMode && !isEditingHeroImage && setLightboxImage({ id: 'hero', url: project.url, alt: project.title })}
            onMouseDown={handleHeroMouseDown}
            onMouseMove={handleHeroMouseMove}
            onMouseUp={handleHeroMouseUp}
            onMouseLeave={handleHeroMouseUp}
          >
            <HeroImage
              src={project.url}
              alt={project.title}
              className="w-full h-full"
              style={{
                transform: `scale(${heroScale})`,
                transformOrigin: `${heroPosition.x}% ${heroPosition.y}%`,
              }}
              quality={90}
              fit="cover"
              priority={true}
            />
            {/* Edit Buttons - Only visible in Edit Mode when not editing */}
            {isEditMode && !isEditingHeroImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/50 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChangeHeroImage();
                  }}
                  size="lg"
                  className="rounded-full shadow-xl"
                >
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Change Image
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingHeroImage(true);
                  }}
                  size="lg"
                  variant="secondary"
                  className="rounded-full shadow-xl"
                >
                  <Edit2 className="w-5 h-5 mr-2" />
                  Adjust Image
                </Button>
              </motion.div>
            )}
            
            {/* Image Editor for Hero Image */}
            {isEditingHeroImage && (
              <>
                <ImageEditor
                  scale={heroScale}
                  position={heroPosition}
                  onScaleChange={setHeroScale}
                  onPositionChange={setHeroPosition}
                  onReset={() => {
                    setHeroScale(1);
                    setHeroPosition({ x: 50, y: 50 });
                  }}
                />
                <Button
                  size="sm"
                  variant="default"
                  className="absolute bottom-4 right-4 z-30 shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingHeroImage(false);
                  }}
                >
                  Done
                </Button>
              </>
            )}
          </div>
        </motion.div>

        {/* Case Study Content - Separate Cards for Each Section - Order 4 on mobile (after hero and sidebars) */}
        {isEditMode && isEditing ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="order-4 lg:order-none"
          >
            <div className="p-8 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md rounded-2xl border border-border/30 shadow-lg">
              <label className="block mb-4">Case Study Content</label>
              
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-500/30 rounded-xl text-sm text-blue-900 dark:text-blue-100">
                <p className="font-semibold mb-2">💡 Editing Markdown Sections</p>
                <p className="text-xs">
                  Edit the content below to modify your case study sections. 
                  Separate sections with <code className="bg-blue-900/20 dark:bg-blue-100/20 px-1.5 py-0.5 rounded">---</code>
                </p>
              </div>
              
              <Textarea
                value={caseStudyContent}
                onChange={(e) => setCaseStudyContent(e.target.value)}
                onBlur={handleContentBlur}
                placeholder="Write your detailed case study content here..."
                rows={12}
                className="font-normal"
              />
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={() => {
                    // Immediately persist the changes to localStorage
                    const updatedProject: ProjectData = {
                      ...project,
                      title: editedTitle,
                      description: editedDescription,
                      caseStudyContent: caseStudyContent,
                      caseStudyImages: caseStudyImagesRef.current,
                      flowDiagramImages: flowDiagramImagesRef.current,
                      videoItems: videoItemsRef.current,
                      galleryAspectRatio,
                      flowDiagramAspectRatio,
                      videoAspectRatio,
                      galleryColumns,
                      flowDiagramColumns,
                      videoColumns,
                      projectImagesPosition,
                      videosPosition,
                      flowDiagramsPosition,
                      solutionCardsPosition,
                    };
                    
                    console.log('💾 Saving reordered content to localStorage');
                    onUpdate(updatedProject);
                    
                    setShowSaveIndicator(true);
                    setTimeout(() => setShowSaveIndicator(false), 3000);
                    
                    setIsEditing(false);
                  }}
                  className="flex-1"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={handleCancelEditing}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="order-4 lg:order-none">
            {/* Mobile Sidebar Summary - Show on mobile, hidden on desktop */}
            {(atGlanceContent || impactContent) && (
              <div className="lg:hidden w-full mb-8">
                <div className="space-y-8">
                  {atGlanceContent && (
                    <AtAGlanceSidebar 
                      content={atGlanceContent.content}
                      title={atGlanceContent.title}
                      isEditMode={isEditMode}
                      onUpdate={handleUpdateAtAGlance}
                      onRemove={handleRemoveAtAGlance}
                    />
                  )}
                  {impactContent && (
                    <ImpactSidebar 
                      content={impactContent.content}
                      title={impactContent.title}
                      isEditMode={isEditMode}
                      onUpdate={handleUpdateImpact}
                      onRemove={handleRemoveImpact}
                    />
                  )}
                </div>
              </div>
            )}
            <CaseStudySections 
        content={(() => {
          // Use cleanedContent (has legacy sidebars stripped) and filter non-whitelisted sections when JSON sidebars exist
          const hasJsonSidebars = Boolean((caseStudySidebars as any)?.atGlance) || Boolean((caseStudySidebars as any)?.impact) ||
                                  Boolean((project as any).caseStudySidebars?.atGlance) || Boolean((project as any).caseStudySidebars?.impact);
          const whitelistedSections = [
            'Overview', 'The challenge', 'My role', 'My role & impact', 'Research insights', 
            'Competitive analysis', 'The solution', 'Solution cards', 'Key features'
          ];
          const excludedSidebarTitles = ['Sidebar 1', 'Sidebar 2', 'At a glance', 'Impact', 'Tech stack', 'Tools'];
          
          const lines = cleanedContent?.split('\n') || [];
          const filteredLines: string[] = [];
          let skipSection = false;
          let currentSectionTitle = '';
          
          for (const line of lines) {
            // Check if this is a section header
            const headerMatch = line.trim().match(/^#\s+(.+)$/);
            if (headerMatch) {
              currentSectionTitle = headerMatch[1].trim();
              const t = currentSectionTitle.toLowerCase();
              
              // Always skip sidebar titles
              if (excludedSidebarTitles.includes(currentSectionTitle) || t === 'at a glance' || t === 'impact' || t === 'sidebar 1' || t === 'sidebar 2' || t === 'tech stack' || t === 'tools') {
                skipSection = true;
                continue;
              }
              
              // When JSON sidebars exist, ONLY allow whitelisted sections
              if (hasJsonSidebars) {
                const isWhitelisted = whitelistedSections.some(w => {
                  const wLower = w.toLowerCase();
                  return t === wLower || t.startsWith(wLower + ' ') || t.includes(wLower);
                });
                if (!isWhitelisted) {
                  console.log('🚫 Filtering out non-whitelisted section from rendered content:', currentSectionTitle);
                  skipSection = true;
                  continue;
                }
              }
              
              // Reset skipSection for whitelisted sections
              skipSection = false;
            }
            
            // Only add lines if we're not in a filtered section
            if (!skipSection) {
              filteredLines.push(line);
            }
          }
          
          return filteredLines.join('\n');
        })()}
            isEditMode={isEditMode}
            onEditClick={() => {
              setOriginalContent(caseStudyContent); // Save current content before editing
              setIsEditing(true);
            }}
            onContentUpdate={(newContent) => {
              // Merge edited content with existing sidebar sections
              const mergedContent = mergeContentWithSidebars(newContent, caseStudyContent);
              
              // Update content when individual section is edited
              setCaseStudyContent(mergedContent);
              
              // Auto-save the project
              const updatedProject: ProjectData = {
                ...project,
                title: editedTitle,
                description: editedDescription,
                caseStudyContent: mergedContent,
                caseStudyImages: caseStudyImagesRef.current,
                flowDiagramImages: flowDiagramImagesRef.current,
                galleryAspectRatio,
                flowDiagramAspectRatio,
                galleryColumns,
                flowDiagramColumns,
                projectImagesPosition,
                flowDiagramsPosition,
                solutionCardsPosition,
              };
              
              onUpdate(updatedProject);
            }}
            atAGlanceSidebar={undefined}
            impactSidebar={undefined}
            projectImagesPosition={projectImagesPosition}
            videosPosition={videosPosition}
            flowDiagramsPosition={flowDiagramsPosition}
            solutionCardsPosition={solutionCardsPosition}
            onMoveProjectImages={handleMoveProjectImages}
            onMoveVideos={handleMoveVideos}
            onMoveFlowDiagrams={handleMoveFlowDiagrams}
            onMoveSolutionCards={handleMoveSolutionCards}
            onRemoveProjectImages={() => {
              setCaseStudyImages([]);
              setProjectImagesPosition(undefined);
              onUpdate({
                ...project,
                title: editedTitle,
                description: editedDescription,
                caseStudyContent,
                caseStudyImages: [],
                flowDiagramImages: flowDiagramImagesRef.current,
                videoItems: videoItemsRef.current,
                galleryAspectRatio,
                flowDiagramAspectRatio,
                videoAspectRatio,
                galleryColumns,
                flowDiagramColumns,
                videoColumns,
                projectImagesPosition: undefined,
                videosPosition,
                flowDiagramsPosition,
                solutionCardsPosition,
                sectionPositions,
              });
            }}
            onRemoveVideos={() => {
              setVideoItems([]);
              setVideosPosition(undefined);
              onUpdate({
                ...project,
                title: editedTitle,
                description: editedDescription,
                caseStudyContent,
                caseStudyImages: caseStudyImagesRef.current,
                flowDiagramImages: flowDiagramImagesRef.current,
                videoItems: [],
                galleryAspectRatio,
                flowDiagramAspectRatio,
                videoAspectRatio,
                galleryColumns,
                flowDiagramColumns,
                videoColumns,
                projectImagesPosition,
                videosPosition: undefined,
                flowDiagramsPosition,
                solutionCardsPosition,
                sectionPositions,
              });
            }}
            onRemoveFlowDiagrams={() => {
              setFlowDiagramImages([]);
              setFlowDiagramsPosition(undefined);
              onUpdate({
                ...project,
                title: editedTitle,
                description: editedDescription,
                caseStudyContent,
                caseStudyImages: caseStudyImagesRef.current,
                flowDiagramImages: [],
                videoItems: videoItemsRef.current,
                galleryAspectRatio,
                flowDiagramAspectRatio,
                videoAspectRatio,
                galleryColumns,
                flowDiagramColumns,
                videoColumns,
                projectImagesPosition,
                videosPosition,
                flowDiagramsPosition: undefined,
                solutionCardsPosition,
                sectionPositions,
              });
            }}
            onRemoveSolutionCards={() => {
              setSolutionCardsPosition(undefined);
              onUpdate({
                ...project,
                title: editedTitle,
                description: editedDescription,
                caseStudyContent,
                caseStudyImages: caseStudyImagesRef.current,
                flowDiagramImages: flowDiagramImagesRef.current,
                videoItems: videoItemsRef.current,
                galleryAspectRatio,
                flowDiagramAspectRatio,
                videoAspectRatio,
                galleryColumns,
                flowDiagramColumns,
                videoColumns,
                projectImagesPosition,
                videosPosition,
                flowDiagramsPosition,
                solutionCardsPosition: undefined,
                sectionPositions,
              });
            }}
            onMoveMarkdownSection={handleMoveMarkdownSection}
            actualPositions={actualPositions}
            totalSections={totalSections}
            imageGallerySlot={
              (caseStudyImages.length > 0 || (isEditMode && project.projectImagesPosition !== undefined)) ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="p-8 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md rounded-2xl border border-border/30 shadow-lg">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl text-purple-600 dark:text-purple-400 shadow-md">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <h3>Project Images</h3>
                    </div>

                    <FlowDiagramGallery
                      images={caseStudyImages}
                      onImagesChange={(newImages) => {
                        console.log('🖼️ [ProjectDetail] Project Images changed:', {
                          projectId: project.id,
                          projectTitle: project.title,
                          oldCount: caseStudyImages.length,
                          newCount: newImages.length,
                          deletedCount: caseStudyImages.length - newImages.length,
                          oldIds: caseStudyImages.map(img => img.id),
                          newIds: newImages.map(img => img.id),
                          timestamp: new Date().toISOString()
                        });
                        
                        // CRITICAL: Update ref SYNCHRONOUSLY before saving
                        caseStudyImagesRef.current = newImages;
                        setCaseStudyImages(newImages);
                        
                        // Auto-save when images change
                        // Use refs for BOTH arrays to ensure we have the latest data
                        const updatedProject: ProjectData = {
                          ...project,
                          title: editedTitle,
                          description: editedDescription,
                          caseStudyContent,
                          caseStudyImages: newImages,
                          flowDiagramImages: flowDiagramImagesRef.current,
                          galleryAspectRatio,
                          flowDiagramAspectRatio,
                          galleryColumns,
                          flowDiagramColumns,
                          projectImagesPosition,
                          flowDiagramsPosition,
                          solutionCardsPosition,
                        };
                        console.log('💾 [ProjectDetail] Calling onUpdate with', newImages.length, 'project images and', flowDiagramImagesRef.current.length, 'flow diagrams');
                        onUpdate(updatedProject);
                        console.log('✅ [ProjectDetail] onUpdate callback completed');
                      }}
                      onImageClick={(image) => setLightboxImage(image)}
                      isEditMode={isEditMode}
                      aspectRatio={galleryAspectRatio}
                      onAspectRatioChange={(newRatio) => {
                        setGalleryAspectRatio(newRatio);
                        // Auto-save when aspect ratio changes
                        // Use refs to get latest image counts
                        const updatedProject: ProjectData = {
                          ...project,
                          title: editedTitle,
                          description: editedDescription,
                          caseStudyContent,
                          caseStudyImages: caseStudyImagesRef.current,
                          flowDiagramImages: flowDiagramImagesRef.current,
                          galleryAspectRatio: newRatio,
                          flowDiagramAspectRatio,
                          galleryColumns,
                          flowDiagramColumns,
                          projectImagesPosition,
                          flowDiagramsPosition,
                          solutionCardsPosition,
                        };
                        onUpdate(updatedProject);
                      }}
                      columns={galleryColumns}
                      onColumnsChange={(newColumns) => {
                        setGalleryColumns(newColumns);
                        // Auto-save when columns change
                        // Use refs to get latest image counts
                        const updatedProject: ProjectData = {
                          ...project,
                          title: editedTitle,
                          description: editedDescription,
                          caseStudyContent,
                          caseStudyImages: caseStudyImagesRef.current,
                          flowDiagramImages: flowDiagramImagesRef.current,
                          galleryAspectRatio,
                          flowDiagramAspectRatio,
                          galleryColumns: newColumns,
                          flowDiagramColumns,
                          projectImagesPosition,
                          flowDiagramsPosition,
                          solutionCardsPosition,
                        };
                        onUpdate(updatedProject);
                      }}
                    />
                  </div>
                </motion.div>
              ) : undefined
            }
            videoSlot={
              (videoItems.length > 0 || (isEditMode && project.videosPosition !== undefined)) ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                >
                  <div className="p-8 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md rounded-2xl border border-border/30 shadow-lg">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl text-red-600 dark:text-red-400 shadow-md">
                        <VideoIcon className="w-6 h-6" />
                      </div>
                      <h3>Videos</h3>
                    </div>

                    <VideoGallery
                      videos={videoItems}
                      onVideosChange={(newVideos) => {
                        console.log('📹 Videos changed:', {
                          oldCount: videoItems.length,
                          newCount: newVideos.length
                        });
                        
                        // CRITICAL: Update ref SYNCHRONOUSLY before saving
                        videoItemsRef.current = newVideos;
                        setVideoItems(newVideos);
                        
                        // Auto-save when videos change
                        const updatedProject: ProjectData = {
                          ...project,
                          title: editedTitle,
                          description: editedDescription,
                          caseStudyContent,
                          caseStudyImages: caseStudyImagesRef.current,
                          flowDiagramImages: flowDiagramImagesRef.current,
                          videoItems: newVideos,
                          galleryAspectRatio,
                          flowDiagramAspectRatio,
                          videoAspectRatio,
                          galleryColumns,
                          flowDiagramColumns,
                          videoColumns,
                          projectImagesPosition,
                          videosPosition,
                          flowDiagramsPosition,
                          solutionCardsPosition,
                        };
                        onUpdate(updatedProject);
                      }}
                      isEditMode={isEditMode}
                      aspectRatio={videoAspectRatio}
                      onAspectRatioChange={(newRatio) => {
                        setVideoAspectRatio(newRatio);
                        // Auto-save when aspect ratio changes
                        const updatedProject: ProjectData = {
                          ...project,
                          title: editedTitle,
                          description: editedDescription,
                          caseStudyContent,
                          caseStudyImages: caseStudyImagesRef.current,
                          flowDiagramImages: flowDiagramImagesRef.current,
                          videoItems: videoItemsRef.current,
                          galleryAspectRatio,
                          flowDiagramAspectRatio,
                          videoAspectRatio: newRatio,
                          galleryColumns,
                          flowDiagramColumns,
                          videoColumns,
                          projectImagesPosition,
                          videosPosition,
                          flowDiagramsPosition,
                          solutionCardsPosition,
                        };
                        onUpdate(updatedProject);
                      }}
                      columns={videoColumns}
                      onColumnsChange={(newColumns) => {
                        setVideoColumns(newColumns);
                        // Auto-save when columns change
                        const updatedProject: ProjectData = {
                          ...project,
                          title: editedTitle,
                          description: editedDescription,
                          caseStudyContent,
                          caseStudyImages: caseStudyImagesRef.current,
                          flowDiagramImages: flowDiagramImagesRef.current,
                          videoItems: videoItemsRef.current,
                          galleryAspectRatio,
                          flowDiagramAspectRatio,
                          videoAspectRatio,
                          galleryColumns,
                          flowDiagramColumns,
                          videoColumns: newColumns,
                          projectImagesPosition,
                          videosPosition,
                          flowDiagramsPosition,
                          solutionCardsPosition,
                        };
                        onUpdate(updatedProject);
                      }}
                    />
                  </div>
                </motion.div>
              ) : undefined
            }
            flowDiagramSlot={
              (flowDiagramImages.length > 0 || (isEditMode && project.flowDiagramsPosition !== undefined)) ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="p-8 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md rounded-2xl border border-border/30 shadow-lg">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl text-blue-600 dark:text-blue-400 shadow-md">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <h3>Flow Diagrams</h3>
                    </div>

                    <FlowDiagramGallery
                      images={flowDiagramImages}
                      onImagesChange={(newImages) => {
                        console.log('📊 Flow Diagram Images changed:', {
                          oldCount: flowDiagramImages.length,
                          newCount: newImages.length,
                          imageIds: newImages.map(img => img.id)
                        });
                        
                        // CRITICAL: Update ref SYNCHRONOUSLY before saving
                        flowDiagramImagesRef.current = newImages;
                        setFlowDiagramImages(newImages);
                        
                        // Auto-save when flow diagram images change
                        // Use refs for BOTH arrays to ensure we have the latest data
                        const updatedProject: ProjectData = {
                          ...project,
                          title: editedTitle,
                          description: editedDescription,
                          caseStudyContent,
                          caseStudyImages: caseStudyImagesRef.current,
                          flowDiagramImages: newImages,
                          galleryAspectRatio,
                          flowDiagramAspectRatio,
                          galleryColumns,
                          flowDiagramColumns,
                          projectImagesPosition,
                          flowDiagramsPosition,
                          solutionCardsPosition,
                        };
                        console.log('💾 Saving project with', caseStudyImagesRef.current.length, 'project images and', newImages.length, 'flow diagrams');
                        onUpdate(updatedProject);
                      }}
                      onImageClick={(image) => setFlowDiagramLightboxImage(image)}
                      isEditMode={isEditMode}
                      aspectRatio={flowDiagramAspectRatio}
                      onAspectRatioChange={(newRatio) => {
                        setFlowDiagramAspectRatio(newRatio);
                        // Auto-save when aspect ratio changes
                        // Use refs to get latest image counts
                        const updatedProject: ProjectData = {
                          ...project,
                          title: editedTitle,
                          description: editedDescription,
                          caseStudyContent,
                          caseStudyImages: caseStudyImagesRef.current,
                          flowDiagramImages: flowDiagramImagesRef.current,
                          videoItems: videoItemsRef.current,
                          galleryAspectRatio,
                          flowDiagramAspectRatio: newRatio,
                          videoAspectRatio,
                          galleryColumns,
                          flowDiagramColumns,
                          videoColumns,
                          projectImagesPosition,
                          videosPosition,
                          flowDiagramsPosition,
                          solutionCardsPosition,
                        };
                        onUpdate(updatedProject);
                      }}
                      columns={flowDiagramColumns}
                      onColumnsChange={(newColumns) => {
                        setFlowDiagramColumns(newColumns);
                        // Auto-save when columns change
                        // Use refs to get latest image counts
                        const updatedProject: ProjectData = {
                          ...project,
                          title: editedTitle,
                          description: editedDescription,
                          caseStudyContent,
                          caseStudyImages: caseStudyImagesRef.current,
                          flowDiagramImages: flowDiagramImagesRef.current,
                          videoItems: videoItemsRef.current,
                          galleryAspectRatio,
                          flowDiagramAspectRatio,
                          videoAspectRatio,
                          galleryColumns,
                          flowDiagramColumns: newColumns,
                          videoColumns,
                          projectImagesPosition,
                          videosPosition,
                          flowDiagramsPosition,
                          solutionCardsPosition,
                        };
                        onUpdate(updatedProject);
                      }}
                    />
                  </div>
                </motion.div>
              ) : undefined
            }
          />
          </div>
        )}

        {/* Save Button (Edit Mode) */}
        {isEditMode && isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 justify-end sticky bottom-6 z-50 order-5 lg:order-none"
          >
            <Button variant="outline" onClick={() => setIsEditing(false)} size="lg">
              Cancel
            </Button>
            <Button onClick={handleSave} size="lg">
              Save Changes
            </Button>
          </motion.div>
        )}
        </div>

        {/* Desktop Sidebar - Show when content exists, hidden on mobile */}
        {(atGlanceContent || impactContent) && (
          <div className="hidden lg:block lg:col-start-2 lg:col-end-2">
            <div className="lg:sticky lg:top-24 space-y-12" style={{ marginTop: '60px' }}>
              {atGlanceContent && (
                <AtAGlanceSidebar 
                  content={atGlanceContent.content}
                  title={atGlanceContent.title}
                  isEditMode={isEditMode}
                  onUpdate={handleUpdateAtAGlance}
                  onRemove={handleRemoveAtAGlance}
                />
              )}
              {impactContent && (
                <ImpactSidebar 
                  content={impactContent.content}
                  title={impactContent.title}
                  isEditMode={isEditMode}
                  onUpdate={handleUpdateImpact}
                  onRemove={handleRemoveImpact}
                />
              )}
            </div>
          </div>
        )}

      </div>

      {/* Lightbox for Case Study Images */}
      {lightboxImage && (
        <Lightbox
          isOpen={true}
          onClose={() => setLightboxImage(null)}
          imageUrl={lightboxImage.url}
          imageAlt={lightboxImage.alt}
          imageCaption={lightboxImage.caption}
          images={caseStudyImages.map(img => ({ url: img.url, alt: img.alt, caption: img.caption }))}
          currentIndex={caseStudyImages.findIndex(img => img.id === lightboxImage.id)}
          onNavigate={(newIndex) => {
            const newImage = caseStudyImages[newIndex];
            if (newImage) {
              setLightboxImage(newImage);
            }
          }}
        />
      )}

      {/* Lightbox for Flow Diagrams */}
      {flowDiagramLightboxImage && (
        <Lightbox
          isOpen={true}
          onClose={() => setFlowDiagramLightboxImage(null)}
          imageUrl={flowDiagramLightboxImage.url}
          imageAlt={flowDiagramLightboxImage.alt}
          imageCaption={flowDiagramLightboxImage.caption}
          images={flowDiagramImages.map(img => ({ url: img.url, alt: img.alt, caption: img.caption }))}
          currentIndex={flowDiagramImages.findIndex(img => img.id === flowDiagramLightboxImage.id)}
          onNavigate={(newIndex) => {
            const newImage = flowDiagramImages[newIndex];
            if (newImage) {
              setFlowDiagramLightboxImage(newImage);
            }
          }}
        />
      )}
    </PageLayout>
  );
}

export default ProjectDetail;