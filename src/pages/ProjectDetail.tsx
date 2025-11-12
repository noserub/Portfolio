import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, Plus, X, Edit2, Image as ImageIcon, Video as VideoIcon, GripVertical, ZoomIn, ZoomOut, Move, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
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
import { getCaseStudySEO, saveCaseStudySEO, type SEOData } from "../utils/seoManager";
import { cleanMarkdownContent, isContentCorrupted } from "../utils/cleanMarkdownContent";
import { uploadImage } from "../utils/imageHelpers";
import { Search } from "lucide-react";
import { Label } from "../components/ui/label";

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

const parseResearchInsightsColumnsValue = (value: any, fallback: 1 | 2 | 3 = 3): 1 | 2 | 3 => {
  const num = Number(value);
  return num === 1 || num === 2 || num === 3 ? (num as 1 | 2 | 3) : fallback;
};

const stripSolutionCardSections = (markdown: string): string => {
  if (!markdown) return markdown;
  return markdown
    .replace(/(^|\n)#{1,2}\s*(?:Solution\s+cards?.*|New\s+Card[^\n]*|Project\s+phases[^\n]*)([\s\S]*?)(?=\n#{1,2}\s|$)/gi, '$1')
    .replace(/\n{3,}/g, '\n\n');
};

export function ProjectDetail({ project, onBack, onUpdate, isEditMode }: ProjectDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Update SEO metadata for case study page
  useCaseStudySEO(project.id, project.title);
  
  // Load case study SEO when project changes
  useEffect(() => {
    const seo = getCaseStudySEO(project.id, project.title);
    setCaseStudySEO(seo);
  }, [project.id, project.title]);
  
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
  }, [project.id, project.caseStudyImages, project.flowDiagramImages, project.videoItems]);
  
  // RECOVERY: Attempt to restore missing image/video references from database
  useEffect(() => {
    const attemptRestore = async () => {
      // Only attempt restore if arrays are empty but we have a project ID
      // Check project prop directly (not state) to avoid dependency issues
      const projectImages = project.caseStudyImages || (project as any).case_study_images || [];
      const projectFlowDiagrams = project.flowDiagramImages || (project as any).flow_diagram_images || [];
      const projectVideos = project.videoItems || (project as any).video_items || [];
      const hasImages = projectImages.length > 0 || projectFlowDiagrams.length > 0 || projectVideos.length > 0;
      
      if (hasImages || !project?.id) {
        return; // Already has data or no project ID
      }
      
      console.log('🔍 RECOVERY: Checking database for missing image/video references...');
      
      try {
        // Query Supabase directly for the project with all image/video fields
        const { data: dbProject, error } = await supabase
          .from('projects')
          .select('case_study_images, flow_diagram_images, video_items')
          .eq('id', project.id)
          .single();
        
        if (error) {
          console.log('⚠️ RECOVERY: Could not query database:', error.message);
          return;
        }
        
        if (dbProject) {
          // Type cast to handle JSONB fields that aren't in the generated types
          const projectData = dbProject as any;
          const dbImages = projectData.case_study_images || [];
          const dbFlowDiagrams = projectData.flow_diagram_images || [];
          const dbVideos = projectData.video_items || [];
          
          const hasDbData = dbImages.length > 0 || dbFlowDiagrams.length > 0 || dbVideos.length > 0;
          
          if (hasDbData) {
            console.log('✅ RECOVERY: Found image/video data in database:', {
              images: dbImages.length,
              flowDiagrams: dbFlowDiagrams.length,
              videos: dbVideos.length
            });
            
            // Restore the arrays (check project prop, not state, to avoid stale closures)
            const currentImages = project.caseStudyImages || (project as any).case_study_images || [];
            const currentFlowDiagrams = project.flowDiagramImages || (project as any).flow_diagram_images || [];
            const currentVideos = project.videoItems || (project as any).video_items || [];
            
            if (dbImages.length > 0 && currentImages.length === 0) {
              setCaseStudyImages(dbImages);
              console.log('✅ RECOVERY: Restored', dbImages.length, 'case study images');
            }
            if (dbFlowDiagrams.length > 0 && currentFlowDiagrams.length === 0) {
              setFlowDiagramImages(dbFlowDiagrams);
              console.log('✅ RECOVERY: Restored', dbFlowDiagrams.length, 'flow diagram images');
            }
            if (dbVideos.length > 0 && currentVideos.length === 0) {
              setVideoItems(dbVideos);
              console.log('✅ RECOVERY: Restored', dbVideos.length, 'videos');
            }
            
            // Persist the restored data
            const updatedProject: ProjectData = {
              ...project,
              caseStudyImages: dbImages.length > 0 ? dbImages : (project.caseStudyImages || []),
              case_study_images: dbImages.length > 0 ? dbImages : ((project as any).case_study_images || []),
              flowDiagramImages: dbFlowDiagrams.length > 0 ? dbFlowDiagrams : (project.flowDiagramImages || []),
              flow_diagram_images: dbFlowDiagrams.length > 0 ? dbFlowDiagrams : ((project as any).flow_diagram_images || []),
              videoItems: dbVideos.length > 0 ? dbVideos : (project.videoItems || []),
              video_items: dbVideos.length > 0 ? dbVideos : ((project as any).video_items || []),
            } as any;
            
            onUpdate(updatedProject);
            console.log('✅ RECOVERY: Persisted restored image/video references to database');
          } else {
            console.log('ℹ️ RECOVERY: No image/video data found in database for this project');
            
            // STEP 2: Try to find files in Supabase Storage that might belong to this project
            // Files are stored with timestamps, so we can try to match by project creation/update time
            console.log('🔍 RECOVERY: Checking Supabase Storage for orphaned files...');
            
            try {
              const { data: storageFiles, error: storageError } = await supabase.storage
                .from('portfolio-images')
                .list('', {
                  limit: 1000,
                  sortBy: { column: 'created_at', order: 'desc' }
                });
              
              if (storageError) {
                console.log('⚠️ RECOVERY: Could not list storage files:', storageError.message);
                return;
              }
              
              if (storageFiles && storageFiles.length > 0) {
                console.log('🔍 RECOVERY: Found', storageFiles.length, 'files in storage');
                
                // Try to match files to this project by checking if URLs contain the project ID
                // or by checking file timestamps relative to project creation
                const projectCreatedAt = (project as any).created_at;
                const projectUpdatedAt = (project as any).updated_at;
                
                // Get public URLs for all files and check if any might belong to this project
                const potentialFiles: Array<{ name: string; url: string; isVideo: boolean }> = [];
                
                for (const file of storageFiles) {
                  // Skip favicon files
                  if (file.name.includes('favicon')) continue;
                  
                  // Get public URL
                  const { data: { publicUrl } } = supabase.storage
                    .from('portfolio-images')
                    .getPublicUrl(file.name);
                  
                  // Check if this might be a project file (images/videos)
                  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
                  const isVideo = /\.(mp4|webm|ogg|ogv)$/i.test(file.name);
                  
                  if (isImage || isVideo) {
                    potentialFiles.push({
                      name: file.name,
                      url: publicUrl,
                      isVideo: isVideo
                    });
                  }
                }
                
                if (potentialFiles.length > 0) {
                  console.log('🔍 RECOVERY: Found', potentialFiles.length, 'potential image/video files in storage');
                  console.log('💡 RECOVERY: To restore these files, you can:');
                  console.log('   1. Manually add them back using the "Add Image" or "Add Video" buttons');
                  console.log('   2. Or use the browser console to run: window.autoRestoreFiles()');
                  console.log('   Potential files:', potentialFiles.map(f => f.name).slice(0, 10));
                  
                  // Create a restoration helper function that captures state setters
                  (window as any).__potentialFiles = potentialFiles;
                  (window as any).__currentProject = project;
                  
                  // Capture state setters and onUpdate in closure
                  const restoreImages = setCaseStudyImages;
                  const restoreFlowDiagrams = setFlowDiagramImages;
                  const restoreVideos = setVideoItems;
                  const updateProject = onUpdate;
                  const currentProject = project;
                  
                  (window as any).autoRestoreFiles = async () => {
                    console.log('🔄 Starting automatic file restoration...');
                    const files = potentialFiles;
                    
                    // Group files by type and guess which gallery they belong to
                    const images: Array<{ name: string; url: string; alt: string }> = [];
                    const flowDiagrams: Array<{ name: string; url: string; alt: string }> = [];
                    const videos: Array<{ name: string; url: string; type: 'upload' }> = [];
                    
                    for (const file of files) {
                      const fileName = file.name.toLowerCase();
                      const altText = file.name
                        .replace(/^\d+_/, '') // Remove timestamp prefix
                        .replace(/\.(png|jpg|jpeg|gif|webp|svg|mp4|webm|ogg)$/i, '') // Remove extension
                        .replace(/_/g, ' ') // Replace underscores with spaces
                        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
                        .trim();
                      
                      if (file.isVideo) {
                        videos.push({
                          name: file.name,
                          url: file.url,
                          type: 'upload' as const
                        });
                      } else if (fileName.includes('flow') || fileName.includes('diagram') || fileName.includes('ia')) {
                        flowDiagrams.push({
                          name: file.name,
                          url: file.url,
                          alt: altText
                        });
                      } else {
                        images.push({
                          name: file.name,
                          url: file.url,
                          alt: altText
                        });
                      }
                    }
                    
                    console.log('📊 Grouped files:', {
                      images: images.length,
                      flowDiagrams: flowDiagrams.length,
                      videos: videos.length
                    });
                    
                    // Restore images
                    if (images.length > 0) {
                      const restoredImages = images.map((img, idx) => ({
                        id: `restored-${Date.now()}-${idx}`,
                        url: img.url,
                        alt: img.alt
                      }));
                      
                      restoreImages(restoredImages);
                      console.log('✅ Restored', restoredImages.length, 'case study images');
                    }
                    
                    // Restore flow diagrams
                    if (flowDiagrams.length > 0) {
                      const restoredFlowDiagrams = flowDiagrams.map((img, idx) => ({
                        id: `restored-flow-${Date.now()}-${idx}`,
                        url: img.url,
                        alt: img.alt
                      }));
                      
                      restoreFlowDiagrams(restoredFlowDiagrams);
                      console.log('✅ Restored', restoredFlowDiagrams.length, 'flow diagram images');
                    }
                    
                    // Restore videos
                    if (videos.length > 0) {
                      const restoredVideos = videos.map((vid, idx) => ({
                        id: `restored-video-${Date.now()}-${idx}`,
                        url: vid.url,
                        type: vid.type as 'upload'
                      }));
                      
                      restoreVideos(restoredVideos);
                      console.log('✅ Restored', restoredVideos.length, 'videos');
                    }
                    
                    // Persist the restored data
                    const updatedProject: ProjectData = {
                      ...currentProject,
                      caseStudyImages: images.length > 0 ? images.map((img, idx) => ({
                        id: `restored-${Date.now()}-${idx}`,
                        url: img.url,
                        alt: img.alt
                      })) : (currentProject.caseStudyImages || []),
                      case_study_images: images.length > 0 ? images.map((img, idx) => ({
                        id: `restored-${Date.now()}-${idx}`,
                        url: img.url,
                        alt: img.alt
                      })) : ((currentProject as any).case_study_images || []),
                      flowDiagramImages: flowDiagrams.length > 0 ? flowDiagrams.map((img, idx) => ({
                        id: `restored-flow-${Date.now()}-${idx}`,
                        url: img.url,
                        alt: img.alt
                      })) : (currentProject.flowDiagramImages || []),
                      flow_diagram_images: flowDiagrams.length > 0 ? flowDiagrams.map((img, idx) => ({
                        id: `restored-flow-${Date.now()}-${idx}`,
                        url: img.url,
                        alt: img.alt
                      })) : ((currentProject as any).flow_diagram_images || []),
                      videoItems: videos.length > 0 ? videos.map((vid, idx) => ({
                        id: `restored-video-${Date.now()}-${idx}`,
                        url: vid.url,
                        type: vid.type as 'upload'
                      })) : (currentProject.videoItems || []),
                      video_items: videos.length > 0 ? videos.map((vid, idx) => ({
                        id: `restored-video-${Date.now()}-${idx}`,
                        url: vid.url,
                        type: vid.type as 'upload'
                      })) : ((currentProject as any).video_items || []),
                    } as any;
                    
                    updateProject(updatedProject);
                    console.log('✅ RECOVERY: Persisted restored files to database');
                    console.log('💡 You may need to refresh the page to see the restored images/videos');
                  };
                  
                  console.log('✅ RECOVERY: Restoration helper ready! Run window.autoRestoreFiles() in the console to restore all files.');
                } else {
                  console.log('ℹ️ RECOVERY: No potential image/video files found in storage');
                }
              } else {
                console.log('ℹ️ RECOVERY: No files found in storage');
              }
            } catch (storageError) {
              console.error('❌ RECOVERY: Error checking storage:', storageError);
            }
          }
        }
      } catch (error) {
        console.error('❌ RECOVERY: Error attempting to restore:', error);
      }
    };
    
    // Only attempt restore once per project load
    attemptRestore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]); // Only run when project ID changes to avoid infinite loops with array dependencies
  
  const [editedTitle, setEditedTitle] = useState(project.title);
  const [editedDescription, setEditedDescription] = useState(project.description);
  
  // SEO state for individual case study
  const [showSEOEditor, setShowSEOEditor] = useState(false);
  const [caseStudySEO, setCaseStudySEO] = useState<SEOData>(() => getCaseStudySEO(project.id, project.title));
  
  // Track if title/description have unsaved changes
  const hasUnsavedTitleDescription = editedTitle !== project.title || editedDescription !== project.description;
  const [editedProjectType, setEditedProjectType] = useState<'product-design' | 'development' | 'branding' | null>(
    project.projectType || (project as any).project_type || null
  );

  // Sync editedTitle and editedDescription when project prop changes
  // Note: We don't include editedTitle/editedDescription in deps to avoid resetting user input
  useEffect(() => {
    setEditedTitle(project.title);
    setEditedDescription(project.description);
  }, [project.title, project.description]);

  // Sync editedProjectType when project prop changes
  useEffect(() => {
    const projectType = project.projectType || (project as any).project_type || null;
    if (projectType !== editedProjectType) {
      setEditedProjectType(projectType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.projectType, editedProjectType]); // project_type is snake_case version, projectType is camelCase
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
  const [solutionCardsPosition, setSolutionCardsPosition] = useState(() => {
    // Explicitly check for null/undefined - if user removed solution cards, respect that
    const pos = project.solutionCardsPosition !== undefined ? project.solutionCardsPosition : (project as any).solution_cards_position;
    return pos !== undefined ? pos : null;
  });
  
  // Track if user has explicitly removed solution cards (to prevent auto-sync from resetting it)
  const solutionCardsRemovedRef = useRef(false);
  
  // Sync solutionCardsPosition with project prop, but respect user's explicit removal
  useEffect(() => {
    const projectPos = project.solutionCardsPosition !== undefined ? project.solutionCardsPosition : (project as any).solution_cards_position;
    
    // If current state is null (user removed it), NEVER sync from project prop
    // This prevents the database value from overriding the user's removal
    if (solutionCardsPosition === null) {
      if (projectPos !== null && projectPos !== undefined) {
        console.log('🔒 Solution cards are null (removed) - ignoring project prop value:', projectPos);
      }
      return; // Don't sync if current state is null
    }
    
    // Only sync if project has a value AND it's different from current state
    if (projectPos !== undefined && projectPos !== null && projectPos !== solutionCardsPosition) {
      console.log('🔄 Syncing solutionCardsPosition from project:', projectPos);
      setSolutionCardsPosition(projectPos);
      solutionCardsRemovedRef.current = false; // Reset flag when syncing from project
    } else if (projectPos === null && solutionCardsPosition !== null) {
      // If project explicitly has null (user removed it), sync to null
      console.log('🔄 Syncing solutionCardsPosition to null (user removed)');
      setSolutionCardsPosition(null);
      solutionCardsRemovedRef.current = true; // Mark as explicitly removed
    }
  }, [project.solutionCardsPosition, (project as any).solution_cards_position, solutionCardsPosition]);
  
  
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
  const isUpdatingSolutionCardsPositionRef = useRef(false);
  
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
  const [keyFeaturesColumns, setKeyFeaturesColumns] = useState<2 | 3>(
    (project as any).keyFeaturesColumns || (project as any).key_features_columns || 3
  );
  const initialResearchColumns = parseResearchInsightsColumnsValue(
    (project as any).researchInsightsColumns ?? (project as any).research_insights_columns
  );
  const [researchInsightsColumns, setResearchInsightsColumns] = useState<1 | 2 | 3>(initialResearchColumns);
  
  // Sync researchInsightsColumns with project prop changes, but only if project actually has a value
  // This prevents resetting user's settings during hot reloads
  useEffect(() => {
    const projectValueRaw = (project as any).researchInsightsColumns ?? (project as any).research_insights_columns;
    if (projectValueRaw === undefined || projectValueRaw === null) {
      return; // Respect the current in-memory value when project doesn't have a persisted setting
    }
    
    const projectValue = parseResearchInsightsColumnsValue(projectValueRaw);
    setResearchInsightsColumns((prev) => {
      if (prev === projectValue) {
        return prev;
      }
      console.log('🔄 Syncing researchInsightsColumns from project:', projectValueRaw, 'normalized:', projectValue, 'current:', prev);
      return projectValue;
    });
  }, [(project as any).researchInsightsColumns, (project as any).research_insights_columns]);
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
      projectType: editedProjectType,
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
  }, [caseStudyContent, project, editedTitle, editedDescription, editedProjectType, galleryAspectRatio, flowDiagramAspectRatio, videoAspectRatio, galleryColumns, flowDiagramColumns, videoColumns, projectImagesPosition, videosPosition, flowDiagramsPosition, solutionCardsPosition, sectionPositions, onUpdate]);

  const handleAddVideosSection = useCallback(() => {
    const next = getNextPosition();
    setVideosPosition(next);
    const updatedProject: ProjectData = {
      ...project,
      title: editedTitle,
      description: editedDescription,
      projectType: editedProjectType,
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
  }, [getNextPosition, project, editedTitle, editedDescription, editedProjectType, caseStudyContent, galleryAspectRatio, flowDiagramAspectRatio, videoAspectRatio, galleryColumns, flowDiagramColumns, videoColumns, projectImagesPosition, flowDiagramsPosition, solutionCardsPosition, sectionPositions, onUpdate]);

  const handleAddImagesSection = useCallback(() => {
    const next = getNextPosition();
    setProjectImagesPosition(next);
    const updatedProject: ProjectData = {
      ...project,
      title: editedTitle,
      description: editedDescription,
      projectType: editedProjectType,
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
  }, [getNextPosition, project, editedTitle, editedDescription, editedProjectType, caseStudyContent, galleryAspectRatio, flowDiagramAspectRatio, videoAspectRatio, galleryColumns, flowDiagramColumns, videoColumns, videosPosition, flowDiagramsPosition, solutionCardsPosition, sectionPositions, onUpdate]);

  const handleAddFlowsSection = useCallback(() => {
    const next = getNextPosition();
    setFlowDiagramsPosition(next);
    const updatedProject: ProjectData = {
      ...project,
      title: editedTitle,
      description: editedDescription,
      projectType: editedProjectType,
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
  }, [getNextPosition, project, editedTitle, editedDescription, editedProjectType, caseStudyContent, galleryAspectRatio, flowDiagramAspectRatio, videoAspectRatio, galleryColumns, flowDiagramColumns, videoColumns, projectImagesPosition, videosPosition, solutionCardsPosition, sectionPositions, onUpdate]);

  const handleAddSolutionCardsSection = useCallback(() => {
    // Find "The solution" section and position solution cards right after it
    const lines = (caseStudyContent || '').split('\n');
    const excludedSidebarTitles = [
      'Sidebar 1', 'Sidebar 2', 'At a glance', 'Impact', 'Tech stack', 'Tools'
    ];
    
    // Parse all sections to find "The solution" section
    const sections: Array<{ title: string; index: number }> = [];
    lines.forEach((line, index) => {
      const match = line.trim().match(/^# (.+)$/);
      if (match) {
        const title = match[1].trim();
        if (!excludedSidebarTitles.includes(title)) {
          sections.push({ title, index });
        }
      }
    });
    
    // Find "The solution" section (case-insensitive, flexible matching)
    const solutionSectionIndex = sections.findIndex(s => {
      const titleLower = s.title.toLowerCase();
      return titleLower.includes('the solution') && 
             (titleLower.includes('new direction') || titleLower === 'the solution');
    });
    
    let position: number;
    if (solutionSectionIndex >= 0) {
      // Position right after "The solution" section
      position = solutionSectionIndex + 1;
      console.log('📍 Found "The solution" section at index', solutionSectionIndex, '- positioning solution cards at', position);
    } else {
      // Fallback: use next available position
    const next = getNextPosition();
      position = next;
      console.log('⚠️ "The solution" section not found - using fallback position', position);
    }
    
    solutionCardsRemovedRef.current = false; // Reset flag when user explicitly adds solution cards
    setSolutionCardsPosition(position);
    const updatedProject: ProjectData = {
      ...project,
      title: editedTitle,
      description: editedDescription,
      projectType: editedProjectType,
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
      solutionCardsPosition: position,
      sectionPositions,
    };
    onUpdate(updatedProject);
  }, [getNextPosition, project, editedTitle, editedDescription, editedProjectType, caseStudyContent, galleryAspectRatio, flowDiagramAspectRatio, videoAspectRatio, galleryColumns, flowDiagramColumns, videoColumns, projectImagesPosition, videosPosition, flowDiagramsPosition, sectionPositions, onUpdate]);

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
      
      // Check if sidebar already exists (might be hidden)
      const existingSidebar = (caseStudySidebars as any)?.[key] || 
                              (project as any)?.caseStudySidebars?.[key] || 
                              (project as any)?.case_study_sidebars?.[key];
      
      // Preserve existing content/title if sidebar was previously removed (hidden)
      // Otherwise use the new body/title
      const updatedSidebars = {
        ...(caseStudySidebars || (project as any)?.caseStudySidebars || (project as any)?.case_study_sidebars || {}),
        [key]: { 
          title: existingSidebar?.title || title, 
          content: body || existingSidebar?.content || '', 
          hidden: false // Always set to false when adding back
        }
      } as any;

      // Update local state immediately so UI reflects the change
      setCaseStudySidebars(updatedSidebars);

      const updatedSectionPositions = {
        ...(sectionPositions as any) || (project as any)?.sectionPositions || {},
        ...(key === 'impact' ? { hideImpact: false } : { hideAtAGlance: false })
      } as any;

      // Update local sectionPositions state immediately so UI reflects the change
      setSectionPositions(updatedSectionPositions);

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
      
      console.log('✅ Added Sidebar back (hidden=false, preserved existing content):', { key, title: updatedSidebars[key].title, hasContent: !!updatedSidebars[key].content, hideFlag: key === 'impact' ? updatedSectionPositions.hideImpact : updatedSectionPositions.hideAtAGlance });
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
  }, [caseStudyContent, project, editedTitle, editedDescription, editedProjectType, galleryAspectRatio, flowDiagramAspectRatio, videoAspectRatio, galleryColumns, flowDiagramColumns, videoColumns, projectImagesPosition, videosPosition, flowDiagramsPosition, solutionCardsPosition, sectionPositions, onUpdate]);

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
      projectType: editedProjectType,
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
  }, [caseStudyContent, project, editedTitle, editedDescription, editedProjectType, galleryAspectRatio, flowDiagramAspectRatio, videoAspectRatio, galleryColumns, flowDiagramColumns, videoColumns, projectImagesPosition, videosPosition, flowDiagramsPosition, solutionCardsPosition, sectionPositions, onUpdate]);
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
  // Sync caseStudySidebars from project prop, but don't overwrite if local state has been modified
  // This prevents overwriting hidden flags when we've just removed a sidebar
  useEffect(() => {
    const projectSidebars = (project as any).caseStudySidebars || (project as any).case_study_sidebars || {};
    // Only sync if project sidebars are different AND local state doesn't have more recent changes
    // Check if hidden flags differ (indicating a removal happened locally)
    const projectAtHidden = projectSidebars?.atGlance?.hidden;
    const projectImpactHidden = projectSidebars?.impact?.hidden;
    const localAtHidden = (caseStudySidebars as any)?.atGlance?.hidden;
    const localImpactHidden = (caseStudySidebars as any)?.impact?.hidden;
    
    // If local state has hidden: true but project has hidden: false/undefined, don't overwrite
    // This means we just removed it and it hasn't synced yet
    const shouldPreserveLocal = 
      (localAtHidden === true && projectAtHidden !== true) ||
      (localImpactHidden === true && projectImpactHidden !== true);
    
    if (!shouldPreserveLocal) {
      // Safe to sync from project
      setCaseStudySidebars(projectSidebars);
    } else {
      console.log('⚠️ Preserving local sidebar state (removal in progress):', {
        local: { atGlance: localAtHidden, impact: localImpactHidden },
        project: { atGlance: projectAtHidden, impact: projectImpactHidden }
      });
    }
  }, [(project as any).caseStudySidebars, (project as any).case_study_sidebars, caseStudySidebars]);

  // Clean up corrupted content on mount and use cleaned content for parsing
  // ALSO strip legacy sidebar blocks on LOAD if JSON sidebars exist
  const [cleanedContent, setCleanedContent] = useState(caseStudyContent);
  
  useEffect(() => {
    // Check JSON sidebars from both local state and project prop (defensive)
    const projectSidebars = (project as any).caseStudySidebars || (project as any).case_study_sidebars || {};
    const atJson = (caseStudySidebars as any)?.atGlance || projectSidebars?.atGlance;
    const impactJson = (caseStudySidebars as any)?.impact || projectSidebars?.impact;
    const hasAt = Boolean(atJson && !atJson.hidden && (atJson.content || atJson.title));
    const hasImpact = Boolean(impactJson && !impactJson.hidden && (impactJson.content || impactJson.title));
    
    // Check if JSON sidebars exist (even if hidden) - needed for stripping markdown
    const hasJsonSidebars = hasAt || hasImpact;
    const hasAnyJsonSidebar = Boolean(atJson || impactJson);
    
    // Always strip sidebar blocks from markdown if JSON sidebars exist (even if hidden)
    // This prevents hidden sidebars from reappearing from markdown on refresh
    if (!hasAnyJsonSidebar) {
      // No JSON sidebars at all, just clean corrupted content if needed
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
    // Continue with cleanup/stripping logic (even if sidebars are hidden)
    
    // BEFORE stripping, extract any sidebar content from markdown if JSON is missing it
    let updatedSidebars = { ...(caseStudySidebars || {}), ...(projectSidebars || {}) };
    let sidebarChanged = false;
    
    // Migrate/restore Sidebar 1 from markdown if JSON doesn't have content
    const needsSidebar1Migration = !atJson?.content && !atJson?.hidden;
    if (needsSidebar1Migration) {
      // Try to extract Sidebar 1/At a glance from markdown
      const lines = (caseStudyContent || '').split('\n');
      let inSidebarSection = false;
      let sidebarContent: string[] = [];
      for (const line of lines) {
        if (line.trim().match(/^#\s*(At a glance|Sidebar 1)\s*$/i)) {
          inSidebarSection = true;
          continue;
        }
        if (inSidebarSection && line.trim().match(/^#\s+/)) {
          break; // Hit next section
        }
        if (inSidebarSection) {
          sidebarContent.push(line);
        }
      }
      if (sidebarContent.length > 0) {
        const content = sidebarContent.join('\n').trim();
        if (content) {
          updatedSidebars.atGlance = { 
            ...(atJson || {}), 
            content, 
            title: atJson?.title || 'Sidebar 1', 
            hidden: false 
          };
          sidebarChanged = true;
          console.log('🔄 Migrated Sidebar 1 content from markdown to JSON');
        }
      }
    }
    
    // Migrate/restore Sidebar 2 from markdown if JSON doesn't have content
    const needsSidebar2Migration = !impactJson?.content && !impactJson?.hidden;
    if (needsSidebar2Migration) {
      // Try to extract Impact/Sidebar 2 from markdown
      const lines = (caseStudyContent || '').split('\n');
      let inSidebarSection = false;
      let sidebarContent: string[] = [];
      for (const line of lines) {
        if (line.trim().match(/^#\s*(Impact|Sidebar 2)\s*$/i)) {
          inSidebarSection = true;
          continue;
        }
        if (inSidebarSection && line.trim().match(/^#\s+/)) {
          break; // Hit next section
        }
        if (inSidebarSection) {
          sidebarContent.push(line);
        }
      }
      if (sidebarContent.length > 0) {
        const content = sidebarContent.join('\n').trim();
        if (content) {
          updatedSidebars.impact = { 
            ...(impactJson || {}), 
            content, 
            title: impactJson?.title || 'Sidebar 2', 
            hidden: false 
          };
          sidebarChanged = true;
          console.log('🔄 Migrated Sidebar 2 content from markdown to JSON');
        }
      }
    }
    
    // JSON sidebars exist - strip legacy blocks from markdown (even if hidden)
    // If JSON sidebar exists (hidden or not), markdown should not contain that sidebar
    const src = caseStudyContent || '';
    let cleaned = src;
    
    // Strip sidebar blocks from markdown if JSON sidebar exists (regardless of hidden flag)
    // This ensures hidden sidebars don't reappear from markdown on refresh
    const titlesToStrip: string[] = [];
    if (atJson) {
      // Sidebar exists in JSON - strip from markdown (even if hidden)
      titlesToStrip.push('At a glance', 'Sidebar 1');
      console.log('🧹 Stripping Sidebar 1 from markdown (exists in JSON, hidden:', atJson.hidden, ')');
    }
    if (impactJson) {
      // Sidebar exists in JSON - strip from markdown (even if hidden)
      titlesToStrip.push('Impact', 'Sidebar 2');
      console.log('🧹 Stripping Sidebar 2 from markdown (exists in JSON, hidden:', impactJson.hidden, ')');
    }
    
    if (titlesToStrip.length > 0) {
      const escaped = titlesToStrip.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const pattern = new RegExp(`^#\\s*(?:${escaped.join('|')})\\s*\n[\\s\\S]*?(?=\n#\\s|\n?$)`, 'gmi');
      cleaned = cleaned.replace(pattern, '').trim();
    }
    
    // Also strip non-whitelisted sections when JSON sidebars exist
    // BUT: Allow any section that appears after "The solution" section (for solution cards grid)
      const whitelistedSections = [
        'Overview', 'The challenge', 'My role', 'My role & impact', 'Research insights', 'Research',
        'Competitive analysis', 'The solution', 'The solution: A new direction', 'Solution cards', 'Key features', 'Project phases', 'New Card'
      ];
    const excludedSidebarTitles = ['Sidebar 1', 'Sidebar 2', 'At a glance', 'Impact', 'Tech stack', 'Tools'];
    
    // Decorative sections that should be in beforeSolution (not solution cards grid)
    const decorativeCardSections = [
      'Overview', 'The challenge', 'My role', 'My role & impact', 'Research insights',
      'Competitive analysis', 'Solution highlights', 'Key contributions'
    ];
    
    const lines = cleaned.split('\n');
    const filteredLines: string[] = [];
    let skipSection = false;
    let currentSectionTitle = '';
    let foundSolutionSection = false;
    
    for (const line of lines) {
      const headerMatch = line.trim().match(/^#\s+(.+)$/);
      if (headerMatch) {
        // We've hit a new section header - reset skipSection
        const previousSkipState = skipSection;
        currentSectionTitle = headerMatch[1].trim();
        const t = currentSectionTitle.toLowerCase();
        
        // Debug: Log ALL section headers found
        console.log('🔍 Found section header:', currentSectionTitle);
        
        // Check if we've passed "The solution" section (but not if this IS the solution section)
        // Only set foundSolutionSection after we've processed "The solution" section itself
        const isSolutionSection = t.includes('solution') && !t.includes('cards');
        if (isSolutionSection && !foundSolutionSection) {
          // This IS "The solution" section - process it first, then mark that we've found it
          // We'll set foundSolutionSection after processing this section
        } else if (foundSolutionSection && !isSolutionSection) {
          // We've already processed "The solution" section, and this is a different section
          // Keep foundSolutionSection = true
        } else if (isSolutionSection && foundSolutionSection) {
          // This is a second solution section (shouldn't happen, but handle it)
        }
        
        // Always skip sidebar titles
        if (excludedSidebarTitles.includes(currentSectionTitle) || t === 'at a glance' || t === 'impact' || t === 'sidebar 1' || t === 'sidebar 2' || t === 'tech stack' || t === 'tools') {
          skipSection = true;
          // Skip the header line itself
          continue;
        }
        
        // If this IS "The solution" section, process it normally (use whitelist check below)
        // Only apply the "after solution" logic to sections that come AFTER "The solution"
        if (foundSolutionSection && !isSolutionSection) {
          // We're AFTER "The solution" section - allow ANY section that's not explicitly excluded
          // (these will appear in the solution cards grid, including custom card titles)
          
          // Explicitly exclude these sections from being solution cards:
          const isResearchInsights = t.includes('research insights');
          const isAnotherSolution = t.includes('solution') && !t.includes('cards');
          const isKeyFeatures = t === 'key features';
          
          // Check if it's a decorative section (these should be before solution, not after)
          const isDecorative = decorativeCardSections.some(dec => {
            const decLower = dec.toLowerCase();
            // Use strict matching - only exclude if it's an exact match or clearly matches a decorative section
            return t === decLower || (t.startsWith(decLower + ' ') || t.startsWith(decLower + ':'));
          });
          
          // If it's not explicitly excluded, allow it as a solution card
          if (!isDecorative && !isKeyFeatures && !isResearchInsights && !isAnotherSolution) {
            // Allow this section - it's part of solution cards grid (including ALL custom card titles)
            skipSection = false;
            console.log('✅ Allowing solution card section (after solution):', currentSectionTitle);
          } else {
            // This is an excluded section - only include if it's in the whitelist (for backward compatibility)
        const isWhitelisted = whitelistedSections.some(w => {
          const wLower = w.toLowerCase();
              const matches = t === wLower || t.startsWith(wLower + ' ') || t.includes(wLower);
              return matches;
            });
            if (isWhitelisted) {
              skipSection = false;
              console.log('✅ Allowing whitelisted section after solution:', currentSectionTitle);
            } else {
              console.log('🧹 Stripping excluded section after solution:', currentSectionTitle, '| isDecorative:', isDecorative, '| isKeyFeatures:', isKeyFeatures, '| isResearchInsights:', isResearchInsights, '| isAnotherSolution:', isAnotherSolution);
              skipSection = true;
              // Skip the header line itself
              continue;
            }
          }
        } else {
          // Before "The solution" OR this IS "The solution" section - use strict whitelist
          const isWhitelisted = whitelistedSections.some(w => {
            const wLower = w.toLowerCase();
            // Match exact, starts with, or contains (for flexible matching)
            // Also check if title starts with the whitelist item (e.g., "The solution: A new direction" matches "The solution")
            const matches = t === wLower || 
                           t.startsWith(wLower + ' ') || 
                           t.startsWith(wLower + ':') ||
                           wLower.startsWith(t) ||
                           t.includes(wLower) ||
                           wLower.includes(t);
            if (matches) {
              console.log('✅ Whitelist match:', currentSectionTitle, 'matches', w, '| t:', t, '| wLower:', wLower);
            }
            return matches;
        });
        if (!isWhitelisted) {
            console.log('🧹 Stripping non-whitelisted section on LOAD:', currentSectionTitle, '| Whitelist:', whitelistedSections, '| t:', t);
          skipSection = true;
            // Skip the header line itself - IMPORTANT: This prevents content from merging with previous section
          continue;
        }
          // Section is whitelisted - include it
        skipSection = false;
          console.log('✅ Including whitelisted section:', currentSectionTitle);
          
          // After processing "The solution" section, mark that we've found it
          if (isSolutionSection) {
            foundSolutionSection = true;
          }
        }
      }
      
      // Only add lines if we're not skipping the current section
      if (!skipSection) {
        filteredLines.push(line);
      }
    }
    
    cleaned = filteredLines.join('\n').trim();
    
    // Also clean corrupted content if needed
    if (isContentCorrupted(cleaned)) {
      cleaned = cleanMarkdownContent(cleaned);
    }
    
    // RECOVERY: Detect and restore orphaned card content after "The solution" section
    // This happens when card headers were stripped but content remained
    // IMPORTANT: We must preserve the solution section's own content and only recover clearly orphaned cards
    const linesForRecovery = cleaned.split('\n');
    let solutionSectionIndex = -1;
    let solutionSectionEndIndex = -1;
    const orphanedContentBlocks: Array<{ startIndex: number; endIndex: number; content: string }> = [];
    
    // Find "The solution" section
    for (let i = 0; i < linesForRecovery.length; i++) {
      const line = linesForRecovery[i];
      const headerMatch = line.trim().match(/^#\s+(.+)$/);
      if (headerMatch) {
        const title = headerMatch[1].trim().toLowerCase();
        if (title === 'the solution' || (title.startsWith('the solution') && !title.includes('cards') && !title.includes('new card'))) {
          solutionSectionIndex = i;
          // Find where this section ends (next header or end of file)
          for (let j = i + 1; j < linesForRecovery.length; j++) {
            const nextLine = linesForRecovery[j];
            if (nextLine.trim().match(/^#\s+/)) {
              solutionSectionEndIndex = j;
              break;
            }
          }
          if (solutionSectionEndIndex === -1) {
            solutionSectionEndIndex = linesForRecovery.length;
          }
          break;
        }
      }
    }
    
    // If we found the solution section, check for orphaned cards AFTER the solution's own content
    if (solutionSectionIndex >= 0 && solutionSectionEndIndex > solutionSectionIndex + 1) {
      // Collect all content lines after solution header
      const solutionContentLines: string[] = [];
      for (let i = solutionSectionIndex + 1; i < solutionSectionEndIndex; i++) {
        const line = linesForRecovery[i];
        if (line.trim().match(/^#\s+/)) {
          break;
        }
        solutionContentLines.push(line);
      }
      
      const solutionContent = solutionContentLines.join('\n').trim();
      const defaultSolutionText = "Armed with these insights, we rallied around a new vision: to become the go-to cannabis discovery engine. This meant a complete overhaul of the app's core functionality.";
      
      // Find where the legitimate solution content ends
      // The solution section should have its own content, then potentially orphaned card content after
      let legitimateSolutionEndIndex = solutionSectionIndex + 1;
      
      // Look for the default solution text or similar intro text
      const solutionContentLower = solutionContent.toLowerCase();
      const defaultSolutionLower = defaultSolutionText.toLowerCase();
      
      // Try to find where the solution's own content ends
      // Look for patterns like "We streamlined", "We redesigned", etc. that indicate card content
      // These typically start a new paragraph after the solution intro
      const cardStartPatterns = [
        /^we\s+(streamlined|redesigned|built|created|developed|implemented|focused|prioritized)/i,
        /^(our|the)\s+(key|main|primary|core|new)/i,
        /^this\s+(included|meant|involved)/i
      ];
      
      // Find the first line that looks like it starts a new card (not solution intro)
      let foundLegitimateEnd = false;
      let contentAfterSolution = '';
      
      for (let i = 0; i < solutionContentLines.length; i++) {
        const line = solutionContentLines[i].trim();
        if (line.length > 20) {
          // Check if this line matches card start patterns
          const looksLikeCardStart = cardStartPatterns.some(pattern => pattern.test(line));
          
          if (looksLikeCardStart && i > 2) {
            // We found content that looks like it starts a card
            // Everything before this is solution content, everything after is potentially orphaned
            legitimateSolutionEndIndex = solutionSectionIndex + 1 + i;
            foundLegitimateEnd = true;
            contentAfterSolution = solutionContentLines.slice(i).join('\n').trim();
            break;
          }
        }
      }
      
      // Only recover if we found clear card content after the solution intro
      if (foundLegitimateEnd && contentAfterSolution.length > 50) {
        // Split the orphaned content into distinct blocks (cards)
        // Look for patterns separated by 2+ blank lines or distinct paragraphs starting with "We"
        const orphanedBlocks = contentAfterSolution.split(/\n\n\n+/);
        
        if (orphanedBlocks.length > 1) {
          // Multiple distinct blocks - each is likely a card
          let currentIndex = legitimateSolutionEndIndex;
          orphanedBlocks.forEach((block, idx) => {
            const blockContent = block.trim();
            if (blockContent.length > 50) {
              orphanedContentBlocks.push({
                startIndex: currentIndex,
                endIndex: currentIndex + block.split('\n').length,
                content: blockContent
              });
              currentIndex += block.split('\n').length + 1;
            }
          });
        } else {
          // Single block - might be one card or multiple merged
          // Only treat as orphaned if it's clearly separated from solution content
          if (contentAfterSolution.length > 100) {
            orphanedContentBlocks.push({
              startIndex: legitimateSolutionEndIndex,
              endIndex: solutionSectionEndIndex,
              content: contentAfterSolution
            });
          }
        }
      }
      
      // If we found orphaned content blocks, restore them as cards
      if (orphanedContentBlocks.length > 0) {
        console.log('🔧 RECOVERY: Found orphaned card content blocks:', orphanedContentBlocks.length, orphanedContentBlocks.map(b => ({ start: b.startIndex, end: b.endIndex, preview: b.content.substring(0, 50) })));
        
        // Rebuild content: keep everything before and including solution section header,
        // remove orphaned blocks from solution section, then add orphaned blocks as separate card sections after solution
        const newLines: string[] = [];
        let cardNumber = 1;
        
        // Build a set of line indices that are part of orphaned blocks (for quick lookup)
        const orphanedLineIndices = new Set<number>();
        orphanedContentBlocks.forEach(block => {
          for (let idx = block.startIndex; idx < block.endIndex; idx++) {
            orphanedLineIndices.add(idx);
          }
        });
        
        // Copy lines up to solution section, keeping solution header but excluding orphaned content
        for (let i = 0; i <= solutionSectionIndex; i++) {
          newLines.push(linesForRecovery[i]);
        }
        
        // Copy solution section content (lines after header) but skip orphaned blocks
        for (let i = solutionSectionIndex + 1; i < solutionSectionEndIndex; i++) {
          if (!orphanedLineIndices.has(i)) {
            newLines.push(linesForRecovery[i]);
          }
        }
        
        // If solution section had content (not just header), ensure proper spacing
        if (newLines.length > 0 && newLines[newLines.length - 1].trim() !== '') {
          newLines.push('');
        }
        
        // Add orphaned blocks as card sections
        orphanedContentBlocks.forEach((block) => {
          newLines.push('');
          newLines.push(`# New Card ${cardNumber}`);
          newLines.push('');
          const contentLines = block.content.split('\n');
          contentLines.forEach(cl => {
            if (cl.trim().length > 0 || newLines.length === 0 || newLines[newLines.length - 1].trim().length > 0) {
              newLines.push(cl);
            }
          });
          newLines.push('');
          cardNumber++;
        });
        
        // Copy remaining lines after solution section
        for (let i = solutionSectionEndIndex; i < linesForRecovery.length; i++) {
          newLines.push(linesForRecovery[i]);
        }
        
        cleaned = newLines.join('\n').trim();
        console.log('✅ RECOVERY: Restored', orphanedContentBlocks.length, 'orphaned content blocks as card sections after solution section');
      }
    }
    
    // RECOVERY STEP 2: Detect and split merged card content within existing "New Card" sections
    // This handles the case where all card content was merged into a single "New Card 1" section
    const linesForCardSplit = cleaned.split('\n');
    const cardStartPatterns = [
      /^we\s+(streamlined|redesigned|built|created|developed|implemented|focused|prioritized)/i,
      /^(our|the)\s+(key|main|primary|core|new)/i,
      /^this\s+(included|meant|involved)/i
    ];
    
    // Find all "New Card" sections and check if they contain merged content
    for (let i = 0; i < linesForCardSplit.length; i++) {
      const line = linesForCardSplit[i];
      const cardHeaderMatch = line.trim().match(/^#\s+New Card (\d+)/i);
      
      if (cardHeaderMatch) {
        // Found a "New Card" section - find where it ends
        let cardEndIndex = i + 1;
        for (let j = i + 1; j < linesForCardSplit.length; j++) {
          const nextLine = linesForCardSplit[j];
          if (nextLine.trim().match(/^#\s+/)) {
            cardEndIndex = j;
            break;
          }
        }
        if (cardEndIndex === i + 1) {
          cardEndIndex = linesForCardSplit.length;
        }
        
        // Get the card content
        const cardContentLines = linesForCardSplit.slice(i + 1, cardEndIndex);
        const cardContent = cardContentLines.join('\n').trim();
        
        // Check if this card content looks like it contains multiple merged cards
        // Look for multiple paragraphs that start with card patterns, separated by blank lines
        const contentBlocks: Array<{ startLine: number; endLine: number; content: string }> = [];
        let currentBlockStart = -1;
        let currentBlockLines: string[] = [];
        
        for (let j = 0; j < cardContentLines.length; j++) {
          const contentLine = cardContentLines[j].trim();
          const isEmptyLine = contentLine.length === 0;
          const isCardStart = !isEmptyLine && cardStartPatterns.some(pattern => pattern.test(contentLine));
          
          if (isCardStart && currentBlockStart >= 0) {
            // Found a new card start - save the previous block
            if (currentBlockLines.length > 0) {
              contentBlocks.push({
                startLine: currentBlockStart,
                endLine: j,
                content: currentBlockLines.join('\n').trim()
              });
            }
            // Start new block
            currentBlockStart = j;
            currentBlockLines = [cardContentLines[j]];
          } else if (isCardStart && currentBlockStart === -1) {
            // First card block found
            currentBlockStart = j;
            currentBlockLines = [cardContentLines[j]];
          } else if (currentBlockStart >= 0) {
            // Continue current block
            currentBlockLines.push(cardContentLines[j]);
          }
        }
        
        // Save the last block if it exists
        if (currentBlockStart >= 0 && currentBlockLines.length > 0) {
          contentBlocks.push({
            startLine: currentBlockStart,
            endLine: cardContentLines.length,
            content: currentBlockLines.join('\n').trim()
          });
        }
        
        // If we found multiple distinct blocks, split them into separate cards
        if (contentBlocks.length > 1) {
          console.log('🔧 CARD SPLIT: Found', contentBlocks.length, 'merged card blocks in "New Card", splitting...');
          
          // Rebuild content with split cards
          const newLines: string[] = [];
          let cardNumber = parseInt(cardHeaderMatch[1], 10);
          
          // Copy everything before this card
          for (let j = 0; j < i; j++) {
            newLines.push(linesForCardSplit[j]);
          }
          
          // Add each block as a separate card
          contentBlocks.forEach((block, blockIdx) => {
            if (block.content.length > 20) {
              newLines.push('');
              newLines.push(`# New Card ${cardNumber}`);
              newLines.push('');
              const blockLines = block.content.split('\n');
              blockLines.forEach(bl => newLines.push(bl));
              newLines.push('');
              cardNumber++;
            }
          });
          
          // Copy everything after this card
          for (let j = cardEndIndex; j < linesForCardSplit.length; j++) {
            newLines.push(linesForCardSplit[j]);
          }
          
          cleaned = newLines.join('\n').trim();
          console.log('✅ CARD SPLIT: Split merged card into', contentBlocks.length, 'separate cards');
          
          // Update linesForCardSplit for next iteration (if there are more cards to check)
          // But break after first split to avoid index issues
          break;
        }
      }
    }
    
    // Update local state if we restored sidebars
    if (sidebarChanged) {
      setCaseStudySidebars(updatedSidebars);
    }
    
    // Only update if we actually removed something AND ensure we preserve JSON sidebars
    if (cleaned !== src || sidebarChanged) {
      console.log('🧹 Stripping legacy sidebar blocks and non-whitelisted sections on LOAD (JSON authoritative)');
      setCleanedContent(cleaned);
      setCaseStudyContent(cleaned);
      
      // ALWAYS preserve JSON sidebars from local state (most up-to-date)
      // This ensures we never overwrite sidebars that were just saved
      const preservedSidebars = sidebarChanged ? updatedSidebars : 
        ((caseStudySidebars && Object.keys(caseStudySidebars).length > 0) 
          ? caseStudySidebars 
          : (projectSidebars && Object.keys(projectSidebars).length > 0 ? projectSidebars : {}));
      
      // Only persist cleaned markdown if we actually cleaned something
      // AND preserve JSON sidebars (never overwrite them with stale project data)
      // CRITICAL: Explicitly preserve images/videos arrays to prevent data loss
      if (cleaned !== src) {
        console.log('💾 Persisting cleaned markdown, preserving JSON sidebars and images/videos:', {
          sidebars: Object.keys(preservedSidebars),
          imagesCount: (project.caseStudyImages || (project as any).case_study_images || []).length,
          videosCount: (project.videoItems || (project as any).video_items || []).length,
          flowDiagramsCount: (project.flowDiagramImages || (project as any).flow_diagram_images || []).length
        });
        onUpdate({
          ...project,
          caseStudyContent: cleaned,
          case_study_content: cleaned,
          // CRITICAL: Explicitly preserve images/videos arrays
          caseStudyImages: project.caseStudyImages || (project as any).case_study_images || [],
          case_study_images: project.caseStudyImages || (project as any).case_study_images || [],
          flowDiagramImages: project.flowDiagramImages || (project as any).flow_diagram_images || [],
          flow_diagram_images: project.flowDiagramImages || (project as any).flow_diagram_images || [],
          videoItems: project.videoItems || (project as any).video_items || [],
          video_items: project.videoItems || (project as any).video_items || [],
          caseStudySidebars: preservedSidebars,
          case_study_sidebars: preservedSidebars
        } as any);
      } else if (sidebarChanged) {
        // Only sidebar migration happened, no markdown cleaning needed
        console.log('💾 Persisting migrated sidebars only:', Object.keys(preservedSidebars));
        onUpdate({
          ...project,
          // CRITICAL: Explicitly preserve images/videos arrays even during sidebar migration
          caseStudyImages: project.caseStudyImages || (project as any).case_study_images || [],
          case_study_images: project.caseStudyImages || (project as any).case_study_images || [],
          flowDiagramImages: project.flowDiagramImages || (project as any).flow_diagram_images || [],
          flow_diagram_images: project.flowDiagramImages || (project as any).flow_diagram_images || [],
          videoItems: project.videoItems || (project as any).video_items || [],
          video_items: project.videoItems || (project as any).video_items || [],
          caseStudySidebars: preservedSidebars,
          case_study_sidebars: preservedSidebars
        } as any);
      }
    } else {
      setCleanedContent(cleaned);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseStudyContent, caseStudySidebars, project.id, project.caseStudyImages, project.flowDiagramImages, project.videoItems, onUpdate]); // Run when content or JSON sidebars change - project.id ensures we re-run on project change

  

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
    if (currentSection !== null && currentSection !== undefined) {
      const lastSection: { title: string; content: string } = currentSection;
      const sectionTitle = lastSection.title.toLowerCase();
      if (sectionTitle === "at a glance" || sectionTitle === "tools" || sectionTitle === "tech stack") {
        if (!atGlanceSection) { // Only set if not already found
          atGlanceSection = lastSection;
        }
      } else if (sectionTitle === "impact") {
        if (!impactSection) { // Only set if not already found
          impactSection = lastSection;
        }
      }
    }


    // Respect both hide flags from sectionPositions AND hidden flag from JSON
    const atIsHidden = hideAtAGlance || Boolean(atJson?.hidden);
    const impactIsHidden = hideImpact || Boolean(impactJson?.hidden);
    
    const resolvedAt = atIsHidden
      ? null
      : (atJson ? { title: atJson.title || 'Sidebar 1', content: atJson.content || '' } : atGlanceSection);
    const resolvedImpact = impactIsHidden
      ? null
      : (impactJson ? { title: impactJson.title || 'Sidebar 2', content: impactJson.content || '' } : impactSection);

    return {
      atGlanceContent: resolvedAt,
      impactContent: resolvedImpact,
      // Only auto-restore when both JSON and markdown are missing and user didn't hide
      // Don't restore if JSON sidebar exists with hidden: true
      needsSidebarRestore:
        ((!resolvedAt && !atIsHidden) && !hasAtAGlance && (!atJson || !atJson.hidden)) ||
        ((!resolvedImpact && !impactIsHidden) && !hasImpact && (!impactJson || !impactJson.hidden))
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanedContent, sectionPositions, caseStudySidebars]); // sectionPositions from project is handled via sectionPositions state

  // Build the sidebars object to persist based on current LOCAL state (most up-to-date)
  // IMPORTANT: Use caseStudySidebars state directly, not atGlanceContent/impactContent which might be stale
  // IMPORTANT: Respect JSON hidden flag FIRST, only use sectionPositions as fallback
  const buildPersistedSidebars = useCallback(() => {
    // Use local state directly - it's always the most up-to-date (updated immediately when user edits)
    const base: any = { ...(caseStudySidebars as any) };
    const currentSectionPositions = (sectionPositions as any) || (project as any)?.sectionPositions || {};
    const hideAtAGlance = Boolean(currentSectionPositions?.hideAtAGlance);
    const hideImpact = Boolean(currentSectionPositions?.hideImpact);

    // Respect JSON hidden flag FIRST, only use sectionPositions as fallback if JSON doesn't have it
    // This prevents overwriting hidden: true when sidebar is removed
    if (base.atGlance) {
      // If JSON already has hidden flag, preserve it; otherwise use sectionPositions
      const hiddenValue = base.atGlance.hidden !== undefined ? base.atGlance.hidden : hideAtAGlance;
      base.atGlance = { ...base.atGlance, hidden: hiddenValue };
    }

    if (base.impact) {
      // If JSON already has hidden flag, preserve it; otherwise use sectionPositions
      const hiddenValue = base.impact.hidden !== undefined ? base.impact.hidden : hideImpact;
      base.impact = { ...base.impact, hidden: hiddenValue };
    }

    console.log('📦 buildPersistedSidebars:', { 
      hasAtGlance: !!base.atGlance, 
      hasImpact: !!base.impact,
      atGlanceHidden: base.atGlance?.hidden,
      impactHidden: base.impact?.hidden,
      atGlanceContent: base.atGlance?.content?.substring(0, 50),
      impactContent: base.impact?.content?.substring(0, 50)
    });

    return base;
  }, [caseStudySidebars, sectionPositions]); // sectionPositions state already tracks project.sectionPositions

  // Remove legacy sidebar blocks from markdown for keys that exist in JSON
  // Optionally accepts sidebars parameter to use updated sidebars immediately
  const stripLegacySidebarBlocks = useCallback((content: string, sidebars?: any) => {
    if (!content) return content;
    const sidebarsToCheck = sidebars || caseStudySidebars || {};
    const hasAt = Boolean((sidebarsToCheck as any)?.atGlance);
    const hasImpact = Boolean((sidebarsToCheck as any)?.impact);
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
  const prevProjectTypeRef = useRef<'product-design' | 'development' | 'branding' | null>(null);
  const prevImagesRef = useRef('');
  const prevFlowDiagramsRef = useRef('');
  const prevVideosRef = useRef('');

  // Watch for unsaved changes flag to update UI
  useEffect(() => {
    const checkUnsavedChanges = () => {
      const hasFlag = document.body.hasAttribute('data-unsaved');
      setHasUnsavedChanges(hasFlag);
    };
    
    // Check initially
    checkUnsavedChanges();
    
    // Watch for changes to the attribute using MutationObserver
    const observer = new MutationObserver(checkUnsavedChanges);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-unsaved']
    });
    
    return () => observer.disconnect();
  }, []);

  // Auto-save content changes with debouncing
  useEffect(() => {
    // Explicit-save mode: do not persist while user is editing. Save only via Save/Done.
    if (isEditMode) {
      return;
    }
    const currentContent = caseStudyContent || '';
    const currentTitle = editedTitle || '';
    const currentDescription = editedDescription || '';
    const currentProjectType = editedProjectType;
    
    // Initialize refs on first render
    if (prevContentRef.current === '' && currentContent) {
      prevContentRef.current = currentContent;
      prevTitleRef.current = currentTitle;
      prevDescriptionRef.current = currentDescription;
      prevProjectTypeRef.current = currentProjectType;
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
    const projectTypeChanged = currentProjectType !== prevProjectTypeRef.current;
    
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
    if (!contentChanged && !titleChanged && !descriptionChanged && !projectTypeChanged && !imagesChanged && !flowDiagramsChanged && !videosChanged && !hasUnsavedFlag) {
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
      projectType: editedProjectType,
          contentLength: caseStudyContent.length,
          blobUrlsRemoved: blobUrlCount,
          originalContent: caseStudyContent.substring(0, 100) + '...',
          cleanedContent: cleanedContent.substring(0, 100) + '...'
        });
        
        // Update refs to current values
        prevContentRef.current = currentContent;
        prevTitleRef.current = currentTitle;
        prevDescriptionRef.current = currentDescription;
        prevProjectTypeRef.current = currentProjectType;
        prevImagesRef.current = currentImagesStr;
        prevFlowDiagramsRef.current = currentFlowDiagramsStr;
        prevVideosRef.current = currentVideosStr;
        
        console.log('📤 ProjectDetail: Calling onUpdate with:', {
          id: project.id,
          title: editedTitle,
          description: editedDescription,
          projectType: editedProjectType,
          project_type: editedProjectType,
          contentLength: caseStudyContent?.length || 0
        });
        
        onUpdate({
          ...project,
          title: editedTitle,
          description: editedDescription,
          projectType: editedProjectType,
          project_type: editedProjectType,
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
  }, [caseStudyContent, editedTitle, editedDescription, editedProjectType, isEditMode, project, onUpdate]);

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
      projectType: editedProjectType,
        contentLength: caseStudyContent?.length || 0
      });
      
      onUpdate({
        ...project,
        title: editedTitle,
        description: editedDescription,
      projectType: editedProjectType,
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
      projectType: editedProjectType,
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
      keyFeaturesColumns,
      key_features_columns: keyFeaturesColumns,
      researchInsightsColumns,
      research_insights_columns: researchInsightsColumns,
    } as any;
    console.log('💾 [handleSave] Saving with', caseStudyImagesRef.current.length, 'project images,', videoItemsRef.current.length, 'videos and', flowDiagramImagesRef.current.length, 'flow diagrams');
    onUpdate(updatedProject);
    setIsEditing(false);
    // Clear unsaved flag
    try { 
      document.body.removeAttribute('data-unsaved');
      setHasUnsavedChanges(false);
    } catch {}
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
      projectType: editedProjectType,
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
            keyFeaturesColumns,
            key_features_columns: keyFeaturesColumns,
            researchInsightsColumns,
            research_insights_columns: researchInsightsColumns,
          } as any;
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
      projectType: editedProjectType,
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
          
          // New images default to 100% zoom, centered (shows full image without cropping)
          // With fit="contain", scale of 1.0 shows the full image; user can zoom in/out as needed
          const newScale = 1.0;
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
      projectType: editedProjectType,
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
      projectType: editedProjectType,
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
      keyFeaturesColumns,
      key_features_columns: keyFeaturesColumns,
      researchInsightsColumns,
      research_insights_columns: researchInsightsColumns,
    } as any;
    
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
      projectType: editedProjectType,
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
    // Get current actual position from calculated positions
    // If actualPositions.videos is -1, it means videos aren't in the items array yet
    // In that case, use videosPosition if set, or calculate a default
    let currentActualPos = actualPositions?.videos;
    if (currentActualPos === -1 || currentActualPos === undefined) {
      currentActualPos = videosPosition;
    }
    
    // If position is still undefined/null, determine a safe default based on other sections
    let currentPos: number;
    if (currentActualPos === undefined || currentActualPos === null || isNaN(currentActualPos) || currentActualPos < 0) {
      // Default: place after project images if they exist, otherwise after Overview
      if (projectImagesPosition !== undefined && projectImagesPosition !== null && projectImagesPosition >= 0) {
        currentPos = projectImagesPosition + 1;
      } else {
        currentPos = 1; // After Overview (position 0)
      }
    } else {
      currentPos = currentActualPos;
    }
    
    const targetPos = direction === 'up' ? currentPos - 1 : currentPos + 1;
    
    // Don't move if at boundary (can't go above position 0)
    if (direction === 'up' && currentPos <= 0) return;
    
    // Don't move if target position would be negative
    if (targetPos < 0) return;
    
    // Find what section is at the target position and swap with it
    let newProjectImagesPos = projectImagesPosition;
    let newVideosPos = targetPos;
    let newFlowDiagramsPos = flowDiagramsPosition;
    let newSolutionCardsPos = solutionCardsPosition;
    
    // Check if another gallery section is at the target position
    if (projectImagesPosition !== undefined && projectImagesPosition === targetPos) {
      // Swap with Project Images
      newProjectImagesPos = currentPos;
      newVideosPos = targetPos;
    } else if (flowDiagramsPosition !== undefined && flowDiagramsPosition === targetPos) {
      // Swap with Flow Diagrams
      newFlowDiagramsPos = currentPos;
      newVideosPos = targetPos;
    } else if (solutionCardsPosition !== undefined && solutionCardsPosition === targetPos) {
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
      projectType: editedProjectType,
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
      projectType: editedProjectType,
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
    if (currentPos === undefined) return;
    
    const targetPos = direction === 'up' ? currentPos - 1 : currentPos + 1;
    
    console.log(`🎴 Attempting to move Solution Cards ${direction}: ${currentPos} → ${targetPos}`);
    
    // Don't move if at boundary
    if (direction === 'up' && currentPos === 0) {
      console.log(`⚠️ Can't move up - already at top`);
      return;
    }
    
    // Prevent auto-adjustment from interfering with manual movement
    isUpdatingSolutionCardsPositionRef.current = true;
    
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
      projectType: editedProjectType,
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
    
    // Reset flag after a delay to allow state to update
    setTimeout(() => {
      isUpdatingSolutionCardsPositionRef.current = false;
    }, 200);
  };

  // Simplified markdown section move handler
  const handleMoveMarkdownSection = (sectionTitle: string, direction: 'up' | 'down') => {
    console.log(`📝 Moving markdown section "${sectionTitle}" ${direction}`);
    
    // Build the combined sections list to find actual positions
    const lines = caseStudyContent?.split('\n') || [];
    const markdownSections: Array<{ title: string; startLine: number; endLine: number }> = [];
    
    // Find all markdown section boundaries
    // Only match top-level headers (# Title), not subsections (## Subtitle)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Match # Title but NOT ## Subtitle (ensure it starts with # followed by space, not ##)
      if (line.startsWith('# ') && !line.startsWith('## ')) {
        const title = line.substring(2).trim();
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
      // Check if Project Images is at this position (only if position is explicitly set)
      if (projectImagesPosition !== undefined && projectImagesPosition === i && (caseStudyImages.length > 0 || isEditMode)) {
        combined.push({ title: '__PROJECT_IMAGES__', type: 'special', position: i });
        continue;
      }
      
      // Check if Videos is at this position (only if position is explicitly set)
      if (videosPosition !== undefined && videosPosition === i && (videoItems.length > 0 || isEditMode)) {
        combined.push({ title: '__VIDEOS__', type: 'special', position: i });
        continue;
      }
      
      // Check if Flow Diagrams is at this position (only if position is explicitly set)
      if (flowDiagramsPosition !== undefined && flowDiagramsPosition === i && (flowDiagramImages.length > 0 || isEditMode)) {
        combined.push({ title: '__FLOW_DIAGRAMS__', type: 'special', position: i });
        continue;
      }
      
      // Check if Solution Cards is at this position (only if position is explicitly set)
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
    // Try exact match first, then case-insensitive, then flexible matching
    let currentIndex = combined.findIndex(c => c.title === sectionTitle);
    if (currentIndex === -1) {
      // Try case-insensitive match
      currentIndex = combined.findIndex(c => c.title.toLowerCase() === sectionTitle.toLowerCase());
    }
    if (currentIndex === -1) {
      // Try flexible matching (e.g., "My role & impact" vs "My role and impact")
      currentIndex = combined.findIndex(c => {
        const cLower = c.title.toLowerCase();
        const sLower = sectionTitle.toLowerCase();
        // Match if titles are similar (e.g., "my role & impact" vs "my role and impact")
        return cLower.replace(/&/g, 'and').replace(/\s+/g, ' ') === sLower.replace(/&/g, 'and').replace(/\s+/g, ' ');
      });
    }
    if (currentIndex === -1) {
      console.error('❌ Section not found in combined list', {
        sectionTitle,
        availableSections: combined.map(c => c.title),
        markdownSections: markdownSections.map(s => s.title)
      });
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
      // When moving a markdown section past a special section (like solution cards),
      // we should swap positions directly, not move the special section
      console.log('🔄 Markdown section moving past special section - swapping positions directly');
      
      // Directly swap the positions: markdown section takes special section's position,
      // and special section takes markdown section's position
      const markdownNewPosition = target.position;
      const specialNewPosition = current.position;
      
      // Update the special section's position based on which one it is
      if (target.title === '__SOLUTION_CARDS__') {
        // When markdown section moves past solution cards, swap positions directly
        // Solution cards takes markdown section's old position, markdown section takes solution cards' position
        // DON'T move markdown content - just swap the position numbers
        console.log(`↔️ Swapping "${sectionTitle}" with Solution Cards: ${current.position} <-> ${target.position}`);
        isUpdatingSolutionCardsPositionRef.current = true;
        setSolutionCardsPosition(specialNewPosition);
          
          // Get persisted sidebars
          const persistedSidebars = buildPersistedSidebars();
          
          // Ensure sectionPositions is serializable
          let cleanSectionPositions: any = {};
          try {
            cleanSectionPositions = sectionPositions ? JSON.parse(JSON.stringify(sectionPositions)) : {};
          } catch (e) {
            console.error('⚠️ Error serializing sectionPositions:', e);
            cleanSectionPositions = {};
          }
          
          // Ensure sidebars are serializable
          let cleanSidebars: any = {};
          try {
            if (persistedSidebars) {
              cleanSidebars = JSON.parse(JSON.stringify(persistedSidebars));
              if (typeof cleanSidebars !== 'object' || Array.isArray(cleanSidebars)) {
                cleanSidebars = {};
              }
            }
          } catch (e) {
            cleanSidebars = {};
          }
          
          const updatedProject: ProjectData = {
            ...project,
            title: editedTitle,
            description: editedDescription,
      projectType: editedProjectType,
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
            keyFeaturesColumns,
            key_features_columns: keyFeaturesColumns,
            researchInsightsColumns,
            research_insights_columns: researchInsightsColumns,
            projectImagesPosition,
            videosPosition,
            flowDiagramsPosition,
          solutionCardsPosition: specialNewPosition,
            sectionPositions: cleanSectionPositions,
            caseStudySidebars: cleanSidebars,
            case_study_sidebars: cleanSidebars,
          } as any;
          onUpdate(updatedProject);
        
        // Reset flag after a delay
        setTimeout(() => {
          isUpdatingSolutionCardsPositionRef.current = false;
        }, 200);
        return;
      } else if (target.title === '__PROJECT_IMAGES__') {
        // Move project images to the next available position
        const newProjectImagesPos = direction === 'up' ? projectImagesPosition - 1 : projectImagesPosition + 1;
        setProjectImagesPosition(newProjectImagesPos);
        
        // Update the project
        const updatedProject: ProjectData = {
          ...project,
          title: editedTitle,
          description: editedDescription,
      projectType: editedProjectType,
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
      } else if (target.title === '__FLOW_DIAGRAMS__') {
        // When markdown section moves past Flow Diagrams, swap positions directly
        // Flow Diagrams takes markdown section's old position, markdown section takes Flow Diagrams' position
        // This prevents issues when Flow Diagrams is at the end (position 1000) and can't move down
        console.log(`↔️ Swapping "${sectionTitle}" with Flow Diagrams: ${current.position} <-> ${target.position}`);
        
        // Swap positions directly (same approach as Solution Cards)
        const markdownNewPosition = target.position;
        const flowDiagramsNewPosition = current.position;
        
        setFlowDiagramsPosition(flowDiagramsNewPosition);
        
        // Get persisted sidebars
        const persistedSidebars = buildPersistedSidebars();
        
        // Ensure sectionPositions is serializable
        let cleanSectionPositions: any = {};
        try {
          cleanSectionPositions = sectionPositions ? JSON.parse(JSON.stringify(sectionPositions)) : {};
        } catch (e) {
          console.error('⚠️ Error serializing sectionPositions:', e);
          cleanSectionPositions = {};
        }
        
        // Ensure sidebars are serializable
        let cleanSidebars: any = {};
        try {
          if (persistedSidebars) {
            cleanSidebars = JSON.parse(JSON.stringify(persistedSidebars));
            if (typeof cleanSidebars !== 'object' || Array.isArray(cleanSidebars)) {
              cleanSidebars = {};
            }
          }
        } catch (e) {
          cleanSidebars = {};
        }
        
        const updatedProject: ProjectData = {
          ...project,
          title: editedTitle,
          description: editedDescription,
      projectType: editedProjectType,
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
          keyFeaturesColumns,
          key_features_columns: keyFeaturesColumns,
          researchInsightsColumns,
          research_insights_columns: researchInsightsColumns,
          projectImagesPosition,
          videosPosition,
          flowDiagramsPosition: flowDiagramsNewPosition,
          solutionCardsPosition,
          sectionPositions: cleanSectionPositions,
          caseStudySidebars: cleanSidebars,
          case_study_sidebars: cleanSidebars,
        } as any;
        onUpdate(updatedProject);
        return;
      } else if (target.title === '__VIDEOS__') {
        // Move videos to the next available position
        const newVideosPos = direction === 'up' ? videosPosition - 1 : videosPosition + 1;
        setVideosPosition(newVideosPos);
        
        // Get persisted sidebars
        const persistedSidebars = buildPersistedSidebars();
        
        // Ensure sectionPositions is serializable
        let cleanSectionPositions: any = {};
        try {
          cleanSectionPositions = sectionPositions ? JSON.parse(JSON.stringify(sectionPositions)) : {};
        } catch (e) {
          console.error('⚠️ Error serializing sectionPositions:', e);
          cleanSectionPositions = {};
        }
        
        // Ensure sidebars are serializable
        let cleanSidebars: any = {};
        try {
          if (persistedSidebars) {
            cleanSidebars = JSON.parse(JSON.stringify(persistedSidebars));
            if (typeof cleanSidebars !== 'object' || Array.isArray(cleanSidebars)) {
              cleanSidebars = {};
            }
          }
        } catch (e) {
          cleanSidebars = {};
        }
        
        const updatedProject: ProjectData = {
          ...project,
          title: editedTitle,
          description: editedDescription,
      projectType: editedProjectType,
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
          keyFeaturesColumns,
          key_features_columns: keyFeaturesColumns,
          researchInsightsColumns,
          research_insights_columns: researchInsightsColumns,
          projectImagesPosition,
          videosPosition: newVideosPos,
          flowDiagramsPosition,
          solutionCardsPosition,
          sectionPositions: cleanSectionPositions,
          caseStudySidebars: cleanSidebars,
          case_study_sidebars: cleanSidebars,
        } as any;
        onUpdate(updatedProject);
        return;
      }
      
      if (target.title === '__SOLUTION_CARDS__') {
        // Move solution cards to the next available position
        const newSolutionCardsPos = solutionCardsPosition !== undefined 
          ? (direction === 'up' ? solutionCardsPosition - 1 : solutionCardsPosition + 1)
          : (direction === 'up' ? combined[currentIndex].position - 1 : combined[currentIndex].position + 1);
        setSolutionCardsPosition(newSolutionCardsPos);
        
        // Get persisted sidebars
        const persistedSidebars = buildPersistedSidebars();
        
        // Ensure sectionPositions is serializable
        let cleanSectionPositions: any = {};
        try {
          cleanSectionPositions = sectionPositions ? JSON.parse(JSON.stringify(sectionPositions)) : {};
        } catch (e) {
          console.error('⚠️ Error serializing sectionPositions:', e);
          cleanSectionPositions = {};
        }
        
        // Ensure sidebars are serializable
        let cleanSidebars: any = {};
        try {
          if (persistedSidebars) {
            cleanSidebars = JSON.parse(JSON.stringify(persistedSidebars));
            if (typeof cleanSidebars !== 'object' || Array.isArray(cleanSidebars)) {
              cleanSidebars = {};
            }
          }
        } catch (e) {
          cleanSidebars = {};
        }
        
        const updatedProject: ProjectData = {
          ...project,
          title: editedTitle,
          description: editedDescription,
      projectType: editedProjectType,
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
          keyFeaturesColumns,
          key_features_columns: keyFeaturesColumns,
          researchInsightsColumns,
          research_insights_columns: researchInsightsColumns,
          projectImagesPosition,
          videosPosition,
          flowDiagramsPosition,
          solutionCardsPosition: newSolutionCardsPos,
          sectionPositions: cleanSectionPositions,
          caseStudySidebars: cleanSidebars,
          case_study_sidebars: cleanSidebars,
        } as any;
        onUpdate(updatedProject);
        return;
      }
      
      // If we get here, we don't know how to handle this special section
      console.error('❌ Unknown special section type:', target.title);
      return;
    }
    
    // Swapping with another markdown section - update markdown content
    // Use flexible matching to handle variations like "My role & impact" vs "My role and impact"
    const normalizeTitle = (title: string) => title.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, ' ').trim();
    
    let currentSection = markdownSections.find(s => s.title === sectionTitle);
    if (!currentSection) {
      // Try case-insensitive match
      currentSection = markdownSections.find(s => s.title.toLowerCase() === sectionTitle.toLowerCase());
    }
    if (!currentSection) {
      // Try flexible matching
      const normalizedSectionTitle = normalizeTitle(sectionTitle);
      currentSection = markdownSections.find(s => normalizeTitle(s.title) === normalizedSectionTitle);
    }
    
    let targetSection = markdownSections.find(s => s.title === target.title);
    if (!targetSection) {
      // Try case-insensitive match
      targetSection = markdownSections.find(s => s.title.toLowerCase() === target.title.toLowerCase());
    }
    if (!targetSection) {
      // Try flexible matching
      const normalizedTargetTitle = normalizeTitle(target.title);
      targetSection = markdownSections.find(s => normalizeTitle(s.title) === normalizedTargetTitle);
    }
    
    console.log('🔍 Section lookup:', {
      sectionTitle,
      targetTitle: target.title,
      currentSection: currentSection ? { title: currentSection.title, startLine: currentSection.startLine, endLine: currentSection.endLine } : null,
      targetSection: targetSection ? { title: targetSection.title, startLine: targetSection.startLine, endLine: targetSection.endLine } : null,
      availableSections: markdownSections.map(s => s.title)
    });
      
      if (!currentSection || !targetSection) {
        console.error('❌ Sections not found in markdown', {
          sectionTitle,
          targetTitle: target.title,
          currentSectionFound: !!currentSection,
          targetSectionFound: !!targetSection,
          allMarkdownSections: markdownSections.map(s => s.title)
        });
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
      
      // Update content state - this will trigger useEffect to update cleanedContent
      setCaseStudyContent(newContent);
      
      // Get persisted sidebars (preserve JSON sidebars)
      const persistedSidebars = buildPersistedSidebars();
      
      // Ensure sectionPositions is serializable (remove any functions or non-serializable data)
      let cleanSectionPositions: any = {};
      try {
        cleanSectionPositions = sectionPositions ? JSON.parse(JSON.stringify(sectionPositions)) : {};
      } catch (e) {
        console.error('⚠️ Error serializing sectionPositions:', e);
        cleanSectionPositions = {};
      }
      
      // Ensure sidebars are serializable and valid JSONB
      let cleanSidebars: any = {};
      try {
        if (persistedSidebars) {
          // Deep clone to ensure it's clean
          cleanSidebars = JSON.parse(JSON.stringify(persistedSidebars));
          // Ensure it's a valid object (not null, not array)
          if (typeof cleanSidebars !== 'object' || Array.isArray(cleanSidebars)) {
            console.warn('⚠️ persistedSidebars is not a valid object, defaulting to {}');
            cleanSidebars = {};
          }
        }
      } catch (e) {
        console.error('⚠️ Error serializing persistedSidebars:', e);
        cleanSidebars = {};
      }
      
      const updatedProject: ProjectData = {
        ...project,
        title: editedTitle,
        description: editedDescription,
      projectType: editedProjectType,
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
        keyFeaturesColumns,
        key_features_columns: keyFeaturesColumns,
        researchInsightsColumns,
        research_insights_columns: researchInsightsColumns,
        projectImagesPosition,
      videosPosition,
        flowDiagramsPosition,
        solutionCardsPosition,
        sectionPositions: cleanSectionPositions,
        // Preserve JSON sidebars - ensure it's serializable
        caseStudySidebars: cleanSidebars,
        case_study_sidebars: cleanSidebars,
      } as any;
      onUpdate(updatedProject);
      // Clear unsaved flag after section movement is saved
      try { 
        document.body.removeAttribute('data-unsaved');
        setHasUnsavedChanges(false);
      } catch {}
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
      projectType: editedProjectType,
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
      ...(caseStudySidebars || (project as any).caseStudySidebars || (project as any).case_study_sidebars || {}),
      atGlance: { title: title || 'Sidebar 1', content: normalizedContent, hidden: false }
    } as any;

    // Update local state immediately so UI reflects the change
    setCaseStudySidebars(updatedSidebars);

    const updatedSectionPositions = {
      ...(sectionPositions as any) || (project as any)?.sectionPositions || {},
      hideAtAGlance: false
    } as any;

    // Persist immediately with both camelCase and snake_case for compatibility
    onUpdate({
      ...project,
      sectionPositions: updatedSectionPositions,
      section_positions: updatedSectionPositions,
      caseStudySidebars: updatedSidebars,
      case_study_sidebars: updatedSidebars
    } as any);
    
    console.log('💾 Saved Sidebar 1 to JSON:', { title, content: normalizedContent.substring(0, 50) + '...' });
  };

  // Handler for updating second sidebar section (Impact) – persist immediately
  const handleUpdateImpact = (title: string, content: string) => {
    const normalizedContent = (content || '').replace(/^#\s+.*\n?/, '').trim();

    // JSON authoritative update (don't modify markdown - it will be cleaned by the cleanup effect)
    const updatedSidebars = {
      ...(caseStudySidebars || (project as any).caseStudySidebars || (project as any).case_study_sidebars || {}),
      impact: { title: title || 'Sidebar 2', content: normalizedContent, hidden: false }
    } as any;

    // Update local state immediately so UI reflects the change
    setCaseStudySidebars(updatedSidebars);
    
    // Immediately persist: clear hideImpact and save sidebars JSON
    const updatedSectionPositions = {
      ...(sectionPositions as any) || (project as any)?.sectionPositions || {},
      hideImpact: false
    } as any;

    // Persist immediately with both camelCase and snake_case for compatibility
    // DO NOT modify caseStudyContent here - let cleanup handle markdown removal
    onUpdate({
      ...project,
      sectionPositions: updatedSectionPositions,
      section_positions: updatedSectionPositions,
      caseStudySidebars: updatedSidebars,
      case_study_sidebars: updatedSidebars
    } as any);
    
    console.log('💾 Saved Sidebar 2 to JSON:', { title, content: normalizedContent.substring(0, 50) + '...' });
  };

  // Handler for removing first sidebar section (At a glance)
  const handleRemoveAtAGlance = () => {
    if (!confirm('Are you sure you want to remove this sidebar section?\n\nThis action cannot be undone.')) {
      return;
    }
    
    // JSON authoritative: set hidden flag in JSON sidebar AND strip markdown immediately
    const currentSidebars = caseStudySidebars || (project as any).caseStudySidebars || (project as any).case_study_sidebars || {};
    const updatedSidebars = {
      ...currentSidebars,
      atGlance: { 
        ...(currentSidebars.atGlance || {}),
        hidden: true 
      }
    } as any;

    // Update local state immediately so UI reflects the change
    setCaseStudySidebars(updatedSidebars);
    
    const updatedSectionPositions = {
      ...(sectionPositions as any) || (project as any)?.sectionPositions || {},
      hideAtAGlance: true
    } as any;

    // Strip markdown immediately - don't wait for cleanup effect
    const cleaned = stripLegacySidebarBlocks(caseStudyContent || '', updatedSidebars);
    if (cleaned !== (caseStudyContent || '')) {
      setCaseStudyContent(cleaned);
      setCleanedContent(cleaned);
    }

    // Persist immediately with both camelCase and snake_case for compatibility
    // Include cleaned markdown to ensure it's persisted
    onUpdate({
      ...project,
      caseStudyContent: cleaned,
      case_study_content: cleaned,
      sectionPositions: updatedSectionPositions,
      section_positions: updatedSectionPositions,
      caseStudySidebars: updatedSidebars,
      case_study_sidebars: updatedSidebars
    } as any);
    
    console.log('🗑️ Removed Sidebar 1 (hidden=true in JSON, markdown stripped)');
  };

  // Handler for removing Impact sidebar (flexible to handle renamed sections)
  const handleRemoveImpact = () => {
    if (!confirm('Are you sure you want to remove this Impact section?\n\nThis action cannot be undone.')) {
      return;
    }
    
    // JSON authoritative: set hidden flag in JSON sidebar AND strip markdown immediately
    const currentSidebars = caseStudySidebars || (project as any).caseStudySidebars || (project as any).case_study_sidebars || {};
    const updatedSidebars = {
      ...currentSidebars,
      impact: { 
        ...(currentSidebars.impact || {}),
        hidden: true 
      }
    } as any;

    // Update local state immediately so UI reflects the change
    setCaseStudySidebars(updatedSidebars);
    
    // Persist hide flag and JSON sidebar
    const updatedSectionPositions = {
      ...(sectionPositions as any) || (project as any)?.sectionPositions || {},
      hideImpact: true
    } as any;

    // Strip markdown immediately - don't wait for cleanup effect
    const cleaned = stripLegacySidebarBlocks(caseStudyContent || '', updatedSidebars);
    if (cleaned !== (caseStudyContent || '')) {
      setCaseStudyContent(cleaned);
      setCleanedContent(cleaned);
    }

    // Persist immediately with both camelCase and snake_case for compatibility
    // Include cleaned markdown to ensure it's persisted
    onUpdate({
      ...project,
      caseStudyContent: cleaned,
      case_study_content: cleaned,
      sectionPositions: updatedSectionPositions,
      section_positions: updatedSectionPositions,
      caseStudySidebars: updatedSidebars,
      case_study_sidebars: updatedSidebars
    } as any);
    
    console.log('🗑️ Removed Sidebar 2 (hidden=true in JSON, markdown stripped):', {
      updatedSidebars,
      cleanedLength: cleaned.length,
      originalLength: (caseStudyContent || '').length,
      impactHidden: updatedSidebars.impact?.hidden
    });
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
    // Include "New Card" patterns for solution cards grid
      const whitelistedSections = [
        'Overview', 'The challenge', 'My role', 'My role & impact', 'Research insights', 'Research',
        'Competitive analysis', 'The solution', 'The solution: A new direction', 'Solution cards', 'Key features', 'Project phases', 'New Card'
      ];
    
    let sections: string[] = [];
    
    // If JSON sidebars exist, ONLY parse whitelisted sections - ignore everything else
    // BUT: Allow any section after "The solution" that isn't decorative (for solution cards grid)
    if (hasJsonSidebars) {
      let foundSolutionSection = false;
      const decorativeCardSections = [
        'Overview', 'The challenge', 'My role', 'My role & impact', 'Research insights',
        'Competitive analysis', 'Solution highlights', 'Key contributions'
      ];
      
      sections = lines
        .filter(line => (line || '').trim().match(/^# (.+)$/))
        .map(line => (line || '').trim().substring(2).trim())
        .filter(title => {
          // Exclude sidebar titles
          if (excludedSidebarTitles.includes(title)) return false;
          
          const t = title.toLowerCase();
          
          // Check if we've passed "The solution" section
          if (t.includes('solution') && !t.includes('cards')) {
            foundSolutionSection = true;
          }
          
          // If we're after "The solution", allow any non-decorative section
          if (foundSolutionSection) {
            const isDecorative = decorativeCardSections.some(dec => {
              const decLower = dec.toLowerCase();
              return t === decLower || t.includes(decLower) || decLower.includes(t);
            });
            const isKeyFeaturesLike = t.includes('key features') || t.includes('project phases');
            if (!isDecorative && !isKeyFeaturesLike) {
              // Allow this section - it's part of solution cards grid
              return true;
            }
          }
          
          // Before "The solution" or for decorative sections - use strict whitelist
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
    // Build base items - include ALL sections except sidebars
    // This allows all sections to be moveable and positioned correctly
    const items: Array<{ title: string; type: string }> = sections.filter(title => {
      // Exclude any sidebar headers from being treated as narrative sections
      const t = title.toLowerCase();
      if (t === 'at a glance' || t === 'impact' || t === 'sidebar 1' || t === 'sidebar 2' || t === 'tech stack' || t === 'tools') return false;
      // Include ALL other sections (The challenge, My role & impact, Overview, etc.)
      return true;
    }).map(s => ({ title: s, type: 'section' }));
    
    // Collect insertions - ONLY insert when position is explicitly set (not undefined)
    const insertions: Array<{ pos: number; item: { title: string; type: string } }> = [];
    
    // Only insert Project Images if position is explicitly set (not null/undefined) AND (images exist OR in edit mode)
    if (projectImagesPosition != null && (caseStudyImages.length > 0 || isEditMode)) {
      insertions.push({ 
        pos: projectImagesPosition, 
        item: { title: '__PROJECT_IMAGES__', type: 'gallery' }
      });
    }
    
    // Only insert Videos if position is explicitly set (not null/undefined) AND (videos exist OR in edit mode)
    if (videosPosition != null && (videoItems.length > 0 || isEditMode)) {
      insertions.push({ 
        pos: videosPosition, 
        item: { title: '__VIDEOS__', type: 'gallery' }
      });
    }
    
    // Only insert Flow Diagrams if position is explicitly set (not null/undefined) AND (diagrams exist OR in edit mode)
    if (flowDiagramsPosition != null && (flowDiagramImages.length > 0 || isEditMode)) {
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
    
    // Only auto-calculate solution cards position if it's explicitly set (not null/undefined)
    // If user has removed solution cards (set to null/undefined), don't auto-calculate or insert
    let calculatedSolutionCardsPosition = solutionCardsPosition;
    if (solutionCardsPosition != null && solutionCardsPosition !== undefined) {
      // Find "The solution" section in the sections array
      const solutionSectionIndex = sections.findIndex(title => {
        const t = title.toLowerCase();
        return t.includes('the solution') && 
               (t.includes('new direction') || t === 'the solution');
      });
      
      if (solutionSectionIndex >= 0) {
        // Position right after "The solution" section
        calculatedSolutionCardsPosition = solutionSectionIndex + 1;
        console.log('📍 Auto-calculated solution cards position:', calculatedSolutionCardsPosition, '(after "The solution" section at index', solutionSectionIndex, ')');
      }
    }
    
    console.log('🔍 Solution Cards Debug:', {
      hasExplicitSolutionCards,
      isEditMode,
      solutionCardsPosition,
      calculatedSolutionCardsPosition,
      sections: sections,
      hasJsonSidebars,
      shouldInsert: solutionCardsPosition != null && calculatedSolutionCardsPosition !== undefined
    });
    
    // Only insert if position is explicitly set (not null/undefined) - respect user's removal
    if (solutionCardsPosition != null && calculatedSolutionCardsPosition !== undefined) {
      console.log('🎴 Inserting Solution Cards at position:', calculatedSolutionCardsPosition);
      insertions.push({ 
        pos: calculatedSolutionCardsPosition, 
        item: { title: '__SOLUTION_CARDS__', type: 'gallery' }
      });
    }
    
    // Sort descending (highest first) to avoid index shifting
    // Filter out any invalid insertions and ensure positions are valid numbers
    const validInsertions = insertions.filter(ins => typeof ins.pos === 'number' && ins.pos >= 0);
    validInsertions.sort((a, b) => b.pos - a.pos);
    
    // Insert in descending order
    for (const insertion of validInsertions) {
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
      total: items.length,
      sections: sections,
      items: items.map(i => i.title),
      projectImagesPosition,
      videosPosition,
      flowDiagramsPosition,
      solutionCardsPosition
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

  // Track previous "The solution" section position to detect when it moves
  const prevSolutionSectionPositionRef = useRef<number | null>(null);
  
  // Auto-update solution cards position ONLY when "The solution" section moves, not when solution cards are manually moved
  useEffect(() => {
    if (solutionCardsPosition == null || !isEditMode || isUpdatingSolutionCardsPositionRef.current) return;
    
    const lines = (caseStudyContent || '').split('\n');
    const excludedSidebarTitles = [
      'Sidebar 1', 'Sidebar 2', 'At a glance', 'Impact', 'Tech stack', 'Tools'
    ];
    
    // Parse all sections to find "The solution" section
    const sections: string[] = [];
    lines.forEach((line) => {
      const match = line.trim().match(/^# (.+)$/);
      if (match) {
        const title = match[1].trim();
        if (!excludedSidebarTitles.includes(title)) {
          sections.push(title);
        }
      }
    });
    
    // Find "The solution" section
    const solutionSectionIndex = sections.findIndex(title => {
      const t = title.toLowerCase();
      return t.includes('the solution') && 
             (t.includes('new direction') || t === 'the solution');
    });
    
    const currentSolutionSectionPosition = solutionSectionIndex >= 0 ? solutionSectionIndex : null;
    
    // Auto-adjust if:
    // 1. "The solution" section exists AND
    // 2. Solution cards position is set AND
    // 3. Solution cards is not positioned right after "The solution" section
    // This will position it correctly on initial load and when "The solution" section moves
    if (currentSolutionSectionPosition !== null && solutionCardsPosition !== undefined) {
      const correctPosition = currentSolutionSectionPosition + 1;
      
      // Only auto-adjust if:
      // - Initial load (prevSolutionSectionPositionRef.current === null), OR
      // - The solution section position changed (reposition)
      // But NOT if the user has manually positioned it (solution section hasn't moved and position is set)
      // And ONLY if we're not currently updating (to prevent loops)
      const solutionSectionMoved = prevSolutionSectionPositionRef.current !== null && 
                                   currentSolutionSectionPosition !== prevSolutionSectionPositionRef.current;
      const isInitialLoad = prevSolutionSectionPositionRef.current === null;
      const needsReposition = solutionCardsPosition !== correctPosition;
      
      // Only auto-position on initial load or when solution section moves
      // Don't auto-position just because content changed (e.g., adding a card) if solution section hasn't moved
      const shouldAutoPosition = (isInitialLoad || solutionSectionMoved) && needsReposition && !isUpdatingSolutionCardsPositionRef.current;
      
      if (shouldAutoPosition) {
        // Auto-adjust to position solution cards after "The solution" section
        // This ensures it's always in the correct position relative to "The solution"
        console.log('📍 Auto-positioning solution cards after "The solution" section:', solutionCardsPosition, '->', correctPosition, isInitialLoad ? '(initial load)' : '(solution section moved)');
        isUpdatingSolutionCardsPositionRef.current = true;
        setSolutionCardsPosition(correctPosition);
          
          // Persist the change
          const updatedProject: ProjectData = {
            ...project,
            title: editedTitle,
            description: editedDescription,
      projectType: editedProjectType,
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
            solutionCardsPosition: correctPosition,
            sectionPositions,
          };
          onUpdate(updatedProject);
          
          // Reset flag after a delay to allow state to update
          setTimeout(() => {
            isUpdatingSolutionCardsPositionRef.current = false;
          }, 100);
      }
    }
    
    // Update the ref for next comparison
    prevSolutionSectionPositionRef.current = currentSolutionSectionPosition;
  }, [caseStudyContent, solutionCardsPosition, isEditMode]);

  return (
    // @ts-expect-error - False positive: JSX children are implicitly passed between tags
    <PageLayout 
      title={project.description || ''}
      subtitle={undefined}
      onBack={handleBack} 
      overline={project.title}
    >
      {/* Editable Title and Description */}
      {isEditMode && (
        <div className="mb-12 px-6 py-4" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="grid gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Project Title</label>
                {hasUnsavedTitleDescription && (
                  <Button
                    onClick={() => {
                      onUpdate({
                        ...project,
                        title: editedTitle,
                        description: editedDescription,
                        projectType: editedProjectType,
                        project_type: editedProjectType,
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
                        solutionCardsPosition,
                        sectionPositions,
                      });
                      console.log('💾 Saved title and description changes');
                    }}
                    size="sm"
                    className="h-8"
                  >
                    Save
                  </Button>
                )}
              </div>
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
            <div>
              <label className="block text-sm font-medium mb-2">Project Category</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditedProjectType(null);
                    // Immediately save the change
                    onUpdate({
                      ...project,
                      title: editedTitle,
                      description: editedDescription,
                      projectType: null,
                      project_type: null,
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
                      solutionCardsPosition,
                      sectionPositions,
                    });
                    console.log('💾 ProjectDetail: Category changed to None, saved immediately');
                  }}
                  className={`rounded-full shadow-lg backdrop-blur-sm px-4 py-2.5 inline-flex items-center justify-center text-sm font-medium transition-colors ${
                    editedProjectType === null
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  None
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditedProjectType('product-design');
                    // Immediately save the change
                    onUpdate({
                      ...project,
                      title: editedTitle,
                      description: editedDescription,
                      projectType: 'product-design',
                      project_type: 'product-design',
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
                      solutionCardsPosition,
                      sectionPositions,
                    });
                    console.log('💾 ProjectDetail: Category changed to product-design, saved immediately');
                  }}
                  className={`rounded-full shadow-lg backdrop-blur-sm px-4 py-2.5 inline-flex items-center justify-center text-sm font-medium transition-colors ${
                    editedProjectType === 'product-design'
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  Product design
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditedProjectType('development');
                    // Immediately save the change
                    onUpdate({
                      ...project,
                      title: editedTitle,
                      description: editedDescription,
                      projectType: 'development',
                      project_type: 'development',
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
                      solutionCardsPosition,
                      sectionPositions,
                    });
                    console.log('💾 ProjectDetail: Category changed to development, saved immediately');
                  }}
                  className={`rounded-full shadow-lg backdrop-blur-sm px-4 py-2.5 inline-flex items-center justify-center text-sm font-medium transition-colors ${
                    editedProjectType === 'development'
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  Development
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditedProjectType('branding');
                    // Immediately save the change
                    onUpdate({
                      ...project,
                      title: editedTitle,
                      description: editedDescription,
                      projectType: 'branding',
                      project_type: 'branding',
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
                      solutionCardsPosition,
                      sectionPositions,
                    });
                    console.log('💾 ProjectDetail: Category changed to branding, saved immediately');
                  }}
                  className={`rounded-full shadow-lg backdrop-blur-sm px-4 py-2.5 inline-flex items-center justify-center text-sm font-medium transition-colors ${
                    editedProjectType === 'branding'
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  Branding
                </button>
              </div>
            </div>
            
            {/* SEO Settings Section */}
            <div className="border-t border-border pt-6 mt-6">
              <button
                type="button"
                onClick={() => setShowSEOEditor(!showSEOEditor)}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-purple-400" />
                  <label className="block text-sm font-medium">SEO Settings</label>
                </div>
                {showSEOEditor ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
              {showSEOEditor && (
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="seo-title" className="text-muted-foreground">Page Title</Label>
                    <Input
                      id="seo-title"
                      value={caseStudySEO.title}
                      onChange={(e) => setCaseStudySEO({ ...caseStudySEO, title: e.target.value })}
                      className="bg-background border-border text-foreground"
                      placeholder="Page title (shown in browser tab)"
                    />
                    <p className="text-xs text-foreground/50">Recommended: 50-60 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seo-description" className="text-muted-foreground">Meta Description</Label>
                    <Textarea
                      id="seo-description"
                      value={caseStudySEO.description}
                      onChange={(e) => setCaseStudySEO({ ...caseStudySEO, description: e.target.value })}
                      className="bg-background border-border text-foreground min-h-[80px]"
                      placeholder="Brief description for search engines"
                    />
                    <p className="text-xs text-foreground/50">Recommended: 150-160 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seo-keywords" className="text-muted-foreground">Keywords</Label>
                    <Input
                      id="seo-keywords"
                      value={caseStudySEO.keywords}
                      onChange={(e) => setCaseStudySEO({ ...caseStudySEO, keywords: e.target.value })}
                      className="bg-background border-border text-foreground"
                      placeholder="keyword1, keyword2, keyword3"
                    />
                    <p className="text-xs text-foreground/50">Comma-separated list of relevant keywords</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seo-canonical" className="text-muted-foreground">Canonical URL</Label>
                    <Input
                      id="seo-canonical"
                      value={caseStudySEO.canonicalUrl || ''}
                      onChange={(e) => setCaseStudySEO({ ...caseStudySEO, canonicalUrl: e.target.value })}
                      className="bg-background border-border text-foreground"
                      placeholder="https://yourdomain.com/project/project-slug"
                    />
                    <p className="text-xs text-foreground/50">
                      Optional: Preferred URL for this case study (without # hash fragments)
                      <br />
                      Example: <code className="text-xs">https://yourdomain.com/project/skype-qik-case-study</code>
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => {
                      saveCaseStudySEO(project.id, caseStudySEO);
                      // Reload page to apply SEO changes
                      window.location.reload();
                    }}
                    className="w-full"
                  >
                    Save SEO Settings
                  </Button>
                </div>
              )}
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
          }),
          ...(!(atGlanceContent || impactContent) && {
            maxWidth: '1200px',
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
              cursor: isEditingHeroImage ? 'crosshair' : (project.url ? 'pointer' : 'default')
            }}
            onClick={() => !isEditMode && !isEditingHeroImage && project.url && setLightboxImage({ id: 'hero', url: project.url, alt: project.title })}
            onMouseDown={handleHeroMouseDown}
            onMouseMove={handleHeroMouseMove}
            onMouseUp={handleHeroMouseUp}
            onMouseLeave={handleHeroMouseUp}
          >
            {/* Empty State - When no image URL */}
            {!project.url || project.url.trim() === '' ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {/* Empty State Content - Grouped and Centered */}
                <div className="flex flex-col items-center justify-center gap-6">
                  {/* Picture Icon */}
                  <ImageIcon className="w-12 h-12 text-white" />
                  
                  {/* Button - Only in Edit Mode */}
                  {isEditMode && !isEditingHeroImage && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChangeHeroImage();
                      }}
                      size="lg"
                      className="rounded-full shadow-xl bg-white text-gray-900 hover:bg-gray-100"
                    >
                      <ImageIcon className="w-5 h-5 mr-2" />
                      Add image
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <>
            <HeroImage
              src={project.url}
              alt={project.title}
              className="w-full h-full"
              style={{
                objectFit: 'contain', // Use contain to show full image without cropping
                transform: `scale(${heroScale})`,
                transformOrigin: `${heroPosition.x}% ${heroPosition.y}%`,
              }}
              quality={90}
              fit="contain" // Changed from "cover" to "contain" to prevent cropping
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
              </>
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
      projectType: editedProjectType,
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
        'Overview', 'The challenge', 'My role', 'My role & impact', 'Research insights', 'Research',
        'Competitive analysis', 'The solution', 'The solution: A new direction', 'Solution cards', 'Key features', 'Project phases', 'New Card'
      ];
          const excludedSidebarTitles = ['Sidebar 1', 'Sidebar 2', 'At a glance', 'Impact', 'Tech stack', 'Tools'];
          
          const lines = cleanedContent?.split('\n') || [];
          const filteredLines: string[] = [];
          let skipSection = false;
          let currentSectionTitle = '';
          let foundSolutionSection = false;
          
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
              // BUT: Allow any section after "The solution" that isn't decorative (for solution cards grid)
              if (hasJsonSidebars) {
                // Check if this IS "The solution" section (don't set foundSolutionSection until after processing it)
                const isSolutionSection = t.includes('solution') && !t.includes('cards');
                
                // If we're after "The solution" (and this is NOT the solution section itself), allow any non-decorative section
                if (foundSolutionSection && !isSolutionSection) {
                  const decorativeCardSections = [
                    'Overview', 'The challenge', 'My role', 'My role & impact', 'Research insights',
                    'Competitive analysis', 'Solution highlights', 'Key contributions'
                  ];
                  const isDecorative = decorativeCardSections.some(dec => {
                    const decLower = dec.toLowerCase();
                    return t === decLower || t.includes(decLower) || decLower.includes(t);
                  });
                  const isKeyFeaturesLike = t.includes('key features') || t.includes('project phases');
                  if (!isDecorative && !isKeyFeaturesLike) {
                    // Allow this section - it's part of solution cards grid
                    skipSection = false;
                    continue;
                  }
                }
                
                // Before "The solution" OR this IS "The solution" section - use strict whitelist
                const isWhitelisted = whitelistedSections.some(w => {
                  const wLower = w.toLowerCase();
                  // Match exact, starts with, or contains (for flexible matching like "The solution: A new direction" matching "The solution")
                  const matches = t === wLower || 
                                 t.startsWith(wLower + ' ') || 
                                 t.startsWith(wLower + ':') ||
                                 wLower.startsWith(t) ||
                                 t.includes(wLower) ||
                                 wLower.includes(t);
                  return matches;
                });
                if (!isWhitelisted) {
                  console.log('🚫 Filtering out non-whitelisted section from rendered content:', currentSectionTitle);
                  skipSection = true;
                  continue;
                }
                skipSection = false;
                
                // After processing "The solution" section, mark that we've found it
                if (isSolutionSection) {
                  foundSolutionSection = true;
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
            latestProjectContent={caseStudyContent}
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
      projectType: editedProjectType,
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
      projectType: editedProjectType,
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
      projectType: editedProjectType,
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
      projectType: editedProjectType,
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
              console.log('🗑️ Removing solution cards - setting position to null');
              solutionCardsRemovedRef.current = true; // Mark as explicitly removed
              setSolutionCardsPosition(null);
              const cleanedCaseStudyContent = stripSolutionCardSections(caseStudyContent || '');
              if (cleanedCaseStudyContent !== (caseStudyContent || '')) {
                console.log('🧹 Stripped solution card markdown from case study content');
                setCaseStudyContent(cleanedCaseStudyContent);
                setCleanedContent(cleanedCaseStudyContent);
              }
              
              const updatedSectionPositions = { ...sectionPositions };
              Object.keys(updatedSectionPositions || {}).forEach((key) => {
                const lower = key.toLowerCase();
                if (
                  key === '__SOLUTION_CARDS__' ||
                  lower.startsWith('solution cards') ||
                  lower.startsWith('new card')
                ) {
                  delete updatedSectionPositions[key];
                }
              });
              setSectionPositions(updatedSectionPositions);
              
              const updatedProject: ProjectData = {
                ...project,
                title: editedTitle,
                description: editedDescription,
      projectType: editedProjectType,
                caseStudyContent: cleanedCaseStudyContent,
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
                solutionCardsPosition: null,
                solution_cards_position: null, // Explicitly set snake_case version too
                sectionPositions: updatedSectionPositions,
                section_positions: updatedSectionPositions,
                case_study_content: cleanedCaseStudyContent,
              };
              console.log('💾 Saving project with solutionCardsPosition = null:', {
                solutionCardsPosition: updatedProject.solutionCardsPosition,
                solution_cards_position: (updatedProject as any).solution_cards_position,
                removedSections: Object.keys(updatedSectionPositions || {}).filter(key => key === '__SOLUTION_CARDS__')
              });
              onUpdate(updatedProject);
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
      projectType: editedProjectType,
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
      projectType: editedProjectType,
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
      projectType: editedProjectType,
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
                        
                        // If videos are added and no position is set, initialize it
                        let updatedVideosPosition = videosPosition;
                        if (newVideos.length > 0 && (videosPosition === undefined || videosPosition === null || isNaN(videosPosition))) {
                          // Default: place after project images if they exist, otherwise after Overview
                          if (projectImagesPosition !== undefined && projectImagesPosition !== null) {
                            updatedVideosPosition = projectImagesPosition + 1;
                          } else {
                            updatedVideosPosition = 1; // After Overview (position 0)
                          }
                          setVideosPosition(updatedVideosPosition);
                        }
                        
                        // Auto-save when videos change
                        const updatedProject: ProjectData = {
                          ...project,
                          title: editedTitle,
                          description: editedDescription,
      projectType: editedProjectType,
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
                          videosPosition: updatedVideosPosition,
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
      projectType: editedProjectType,
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
      projectType: editedProjectType,
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
      projectType: editedProjectType,
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
      projectType: editedProjectType,
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
      projectType: editedProjectType,
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
            keyFeaturesColumns={keyFeaturesColumns}
            onKeyFeaturesColumnsChange={(columns) => {
              setKeyFeaturesColumns(columns);
              // Auto-save when columns change
              const updatedProject: ProjectData = {
                ...project,
                title: editedTitle,
                description: editedDescription,
      projectType: editedProjectType,
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
                solutionCardsPosition,
                keyFeaturesColumns: columns,
                key_features_columns: columns,
              } as any;
              onUpdate(updatedProject);
            }}
            researchInsightsColumns={researchInsightsColumns}
            onResearchInsightsColumnsChange={(columns) => {
              setResearchInsightsColumns(columns);
              // Auto-save when columns change
              const updatedProject: ProjectData = {
                ...project,
                title: editedTitle,
                description: editedDescription,
      projectType: editedProjectType,
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
                solutionCardsPosition,
                keyFeaturesColumns,
                key_features_columns: keyFeaturesColumns,
                researchInsightsColumns: columns,
                research_insights_columns: columns,
              } as any;
              onUpdate(updatedProject);
            }}
          />
          </div>
        )}

        {/* Save Button (Edit Mode) - Show when editing OR when there are unsaved changes */}
        {isEditMode && (isEditing || hasUnsavedChanges) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 justify-end sticky bottom-6 z-50 order-5 lg:order-none"
          >
            {isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(false)} size="lg">
                Cancel
              </Button>
            )}
            <Button 
              onClick={() => {
                if (isEditing) {
                  handleSave();
                } else {
                  // Save current state even if not in editing mode
                  const persistedSidebars = buildPersistedSidebars();
                  const cleanedForSave = stripLegacySidebarBlocks(caseStudyContent || '');
                  const updatedProject: ProjectData = {
                    ...project,
                    title: editedTitle,
                    description: editedDescription,
                    projectType: editedProjectType,
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
                    keyFeaturesColumns,
                    key_features_columns: keyFeaturesColumns,
                    researchInsightsColumns,
                    research_insights_columns: researchInsightsColumns,
                    sectionPositions,
                    caseStudySidebars: persistedSidebars,
                    case_study_sidebars: persistedSidebars,
                  } as any;
                  onUpdate(updatedProject);
                  // Clear unsaved flag
                  try { 
                    document.body.removeAttribute('data-unsaved');
                    setHasUnsavedChanges(false);
                  } catch {}
                }
              }} 
              size="lg"
            >
              {isEditing ? 'Save Changes' : 'Save'}
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