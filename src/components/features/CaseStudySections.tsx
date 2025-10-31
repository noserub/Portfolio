import { useState } from "react";
import { motion } from "motion/react";
import { MarkdownRenderer } from "../MarkdownRenderer";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { 
  Target, 
  Award, 
  Lightbulb, 
  BarChart3, 
  Rocket, 
  UserCheck, 
  Star,
  Layout,
  MapPin,
  Search,
  TrendingUp,
  Users,
  Key,
  User,
  Compass,
  Camera,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown
} from "lucide-react";

interface CaseStudySectionsProps {
  content: string;
  imageGallerySlot?: React.ReactNode;
  videoSlot?: React.ReactNode;
  flowDiagramSlot?: React.ReactNode;
  isEditMode?: boolean;
  onEditClick?: () => void;
  atAGlanceSidebar?: React.ReactNode;
  impactSidebar?: React.ReactNode;
  onContentUpdate?: (newContent: string) => void;
  projectImagesPosition?: number;
  videosPosition?: number;
  flowDiagramsPosition?: number;
  solutionCardsPosition?: number;
  onMoveProjectImages?: (direction: 'up' | 'down') => void;
  onMoveVideos?: (direction: 'up' | 'down') => void;
  onMoveFlowDiagrams?: (direction: 'up' | 'down') => void;
  onMoveSolutionCards?: (direction: 'up' | 'down') => void;
  onRemoveProjectImages?: () => void;
  onRemoveVideos?: () => void;
  onRemoveFlowDiagrams?: () => void;
  onRemoveSolutionCards?: () => void;
  onMoveMarkdownSection?: (sectionTitle: string, direction: 'up' | 'down') => void;
  sectionPositions?: Record<string, number>;
  actualPositions?: {
    projectImages: number;
    videos: number;
    flowDiagrams: number;
    solutionCards: number;
    total: number;
  };
  totalSections?: number;
  keyFeaturesColumns?: 2 | 3;
  onKeyFeaturesColumnsChange?: (columns: 2 | 3) => void;
}

// Map section titles to icons and gradients
const sectionConfig: Record<string, { icon: any; gradient: string; iconColor: string }> = {
  "At a glance": { 
    icon: Info, 
    gradient: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
    iconColor: "text-cyan-600 dark:text-cyan-400"
  },
  "Overview": { 
    icon: Target, 
    gradient: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    iconColor: "text-blue-600 dark:text-blue-400"
  },
  "The challenge": { 
    icon: AlertCircle, 
    gradient: "linear-gradient(135deg, #ef4444, #f97316)",
    iconColor: "text-red-600 dark:text-red-400"
  },
  "My role & impact": { 
    icon: Award, 
    gradient: "linear-gradient(135deg, #8b5cf6, #ec4899)",
    iconColor: "text-purple-600 dark:text-purple-400"
  },
  "Research insights": { 
    icon: Lightbulb, 
    gradient: "linear-gradient(135deg, #ec4899, #fbbf24)",
    iconColor: "text-pink-600 dark:text-pink-400"
  },
  "Competitive analysis": { 
    icon: BarChart3, 
    gradient: "linear-gradient(135deg, #fbbf24, #10b981)",
    iconColor: "text-yellow-600 dark:text-yellow-400"
  },
  "The solution: A new direction": { 
    icon: Rocket, 
    gradient: "linear-gradient(135deg, #10b981, #06b6d4)",
    iconColor: "text-green-600 dark:text-green-400"
  },
  "Key features": { 
    icon: CheckCircle, 
    gradient: "linear-gradient(135deg, #10b981, #06b6d4)",
    iconColor: "text-emerald-600 dark:text-emerald-400"
  },
  "Solution highlights": { 
    icon: CheckCircle, 
    gradient: "linear-gradient(135deg, #10b981, #06b6d4)",
    iconColor: "text-emerald-600 dark:text-emerald-400"
  },
  "Registration, onboarding and compliance": { 
    icon: UserCheck, 
    gradient: "linear-gradient(135deg, #06b6d4, #3b82f6)",
    iconColor: "text-cyan-600 dark:text-cyan-400"
  },
  "Product reviews": { 
    icon: Star, 
    gradient: "linear-gradient(135deg, #ec4899, #8b5cf6)",
    iconColor: "text-pink-600 dark:text-pink-400"
  },
  "Navigation, feeds, and business profiles": { 
    icon: Layout, 
    gradient: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
    iconColor: "text-purple-600 dark:text-purple-400"
  },
  "Dispensary finder": { 
    icon: MapPin, 
    gradient: "linear-gradient(135deg, #3b82f6, #10b981)",
    iconColor: "text-blue-600 dark:text-blue-400"
  },
  "Search, explore, and strain pages": { 
    icon: Search, 
    gradient: "linear-gradient(135deg, #fbbf24, #ec4899)",
    iconColor: "text-yellow-600 dark:text-yellow-400"
  },
  "Business and consumer impact": { 
    icon: TrendingUp, 
    gradient: "linear-gradient(135deg, #10b981, #fbbf24)",
    iconColor: "text-green-600 dark:text-green-400"
  },
  "Scaling the design team": { 
    icon: Users, 
    gradient: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
    iconColor: "text-cyan-600 dark:text-cyan-400"
  },
  "Key takeaway": { 
    icon: Key, 
    gradient: "linear-gradient(135deg, #ec4899, #fbbf24)",
    iconColor: "text-pink-600 dark:text-pink-400"
  },
  "Design team": { 
    icon: User, 
    gradient: "linear-gradient(135deg, #8b5cf6, #ec4899)",
    iconColor: "text-purple-600 dark:text-purple-400"
  },
  "Key contributions": { 
    icon: Rocket, 
    gradient: "linear-gradient(135deg, #10b981, #06b6d4)",
    iconColor: "text-green-600 dark:text-green-400"
  }
};

// Get section configuration with fallback for any sidebar section
const getSectionConfig = (title: string) => {
  if (sectionConfig[title]) {
    return sectionConfig[title];
  }
  
  // Default configuration for any sidebar section (first non-Overview section)
  return {
    icon: Info,
    gradient: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
    iconColor: "text-cyan-600 dark:text-cyan-400"
  };
};

export function CaseStudySections({ 
  content, 
  imageGallerySlot,
  videoSlot,
  flowDiagramSlot,
  isEditMode, 
  onEditClick, 
  atAGlanceSidebar, 
  impactSidebar, 
  onContentUpdate,
  actualPositions,
  projectImagesPosition = 2, // Default: after Overview (position 2)
  videosPosition = 998, // Default: before Flow Diagrams
  solutionCardsPosition, // No default - only show if explicitly set
  flowDiagramsPosition = 1000,  // Default: at END (after Solution Cards)
  onMoveProjectImages,
  onMoveVideos,
  onMoveFlowDiagrams,
  onMoveSolutionCards,
  onRemoveProjectImages,
  onRemoveVideos,
  onRemoveFlowDiagrams,
  onRemoveSolutionCards,
  onMoveMarkdownSection,
  totalSections = 1000,
  keyFeaturesColumns = 3,
  onKeyFeaturesColumnsChange
}: CaseStudySectionsProps) {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedSectionTitle, setEditedSectionTitle] = useState<string>("");
  const [editedSectionContent, setEditedSectionContent] = useState<string>("");
  const [originalSectionTitle, setOriginalSectionTitle] = useState<string>("");
  const [originalSectionContent, setOriginalSectionContent] = useState<string>("");

  const toggleCard = (index: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const startEditingSection = (sectionTitle: string, sectionContent: string) => {
    setEditingSection(sectionTitle);
    setEditedSectionTitle(sectionTitle);
    setEditedSectionContent(sectionContent);
    setOriginalSectionTitle(sectionTitle);
    setOriginalSectionContent(sectionContent);
  };

  const cancelSectionEdit = () => {
    setEditingSection(null);
    setEditedSectionTitle("");
    setEditedSectionContent("");
    setOriginalSectionTitle("");
    setOriginalSectionContent("");
  };

  const saveSectionEdit = (sectionTitle: string) => {
    if (!onContentUpdate) {
      console.error('No onContentUpdate callback provided');
      return;
    }

    // Replace the section title and content in the full content
    const lines = content.split('\n');
    const newLines: string[] = [];
    let inTargetSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is the start of our target section
      const headerMatch = line.match(/^# (.+)$/);
      if (headerMatch && headerMatch[1].trim() === sectionTitle) {
        inTargetSection = true;
        // Add the EDITED header (new title)
        newLines.push(`# ${editedSectionTitle}`);
        newLines.push(editedSectionContent); // Add the edited content
        continue;
      }

      // Check if we've hit another top-level section
      if (inTargetSection && line.match(/^# (.+)$/)) {
        inTargetSection = false;
      }

      // If not in target section, keep the line
      if (!inTargetSection) {
        newLines.push(line);
      }
    }

    const newContent = newLines.join('\n');
    onContentUpdate(newContent);
    setEditingSection(null);
    setEditedSectionTitle("");
    setEditedSectionContent("");
    setOriginalSectionTitle("");
    setOriginalSectionContent("");
  };

  const addNewCard = () => {
    if (!onContentUpdate) {
      console.error('No onContentUpdate callback provided');
      return;
    }

    // Create a new card section with default content
    const newCardTitle = `New Card ${afterSolution.length + 1}`;
    const newCardContent = `Add content for ${newCardTitle} here.\n\nYou can use Markdown formatting:\n- Bullet points\n- **Bold text**\n- *Italic text*`;
    
    // Add the new section to the end of the content
    const newSection = `\n\n# ${newCardTitle}\n${newCardContent}`;
    const newContent = content + newSection;
    
    onContentUpdate(newContent);
  };

  const removeCard = (sectionTitle: string) => {
    if (!onContentUpdate) {
      console.error('No onContentUpdate callback provided');
      return;
    }

    if (!confirm(`Are you sure you want to remove "${sectionTitle}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    // Remove the section from the content
    const lines = content.split('\n');
    const newLines: string[] = [];
    let inTargetSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is the start of our target section
      const headerMatch = line.match(/^# (.+)$/);
      if (headerMatch && headerMatch[1].trim() === sectionTitle) {
        inTargetSection = true;
        continue; // Skip the header line
      }

      // Check if we've hit another top-level section
      if (inTargetSection && line.match(/^# (.+)$/)) {
        inTargetSection = false;
      }

      // Only keep lines that are not in the target section
      if (!inTargetSection) {
        newLines.push(line);
      }
    }

    const newContent = newLines.join('\n');
    onContentUpdate(newContent);
  };

  const moveSectionUp = (sectionTitle: string) => {
    
    if (onMoveMarkdownSection) {
      onMoveMarkdownSection(sectionTitle, 'up');
    } else {
      console.error('❌ No onMoveMarkdownSection callback provided');
    }
  };

  const moveSectionDown = (sectionTitle: string) => {
    
    if (onMoveMarkdownSection) {
      onMoveMarkdownSection(sectionTitle, 'down');
    } else {
      console.error('❌ No onMoveMarkdownSection callback provided');
    }
  };

  // Parse content into sections based on top-level headers (# Header)
  const parseSections = () => {
    const lines = content.split('\n');
    const sections: Array<{ title: string; content: string }> = [];
    let currentSection: { title: string; content: string } | null = null;
    let skipImpactSubsection = false;

    lines.forEach(line => {
      // Check for top-level header (# Title only, not ## subsections)
      if (line.trim().match(/^# (.+)$/)) {
        // Save previous section if exists
        if (currentSection) {
          sections.push(currentSection);
        }
        // Start new section
        const title = (line || '').trim().substring(2).trim();
        currentSection = { title, content: '' };
        skipImpactSubsection = false;
      } else if (currentSection) {
        // Check if this is the ## Impact subsection header (only skip if we're in the Impact section)
        if (line.trim() === '## Impact' && currentSection.title === 'Impact') {
          skipImpactSubsection = true;
          return; // Don't add this line
        }
        // Check if we've hit a new subsection (stop skipping Impact)
        if (line.trim().startsWith('## ') && skipImpactSubsection) {
          skipImpactSubsection = false;
        }
        // Add line to current section (unless we're skipping Impact content)
        if (!skipImpactSubsection) {
          currentSection.content += line + '\n';
        }
      }
    });

    // Add last section
    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  };

  // Parse subsections with h2 headers (## Name)
  const parseSubsections = (content: string) => {
    const lines = content.split('\n');
    const items: Array<{ name: string; content: string }> = [];
    let currentItem: { name: string; content: string } | null = null;

    lines.forEach(line => {
      // Check for h2 header (## Name)
      if (line.trim().match(/^## (.+)$/)) {
        // Save previous item if exists
        if (currentItem) {
          items.push(currentItem);
        }
        // Start new item
        const name = (line || '').trim().substring(3).trim();
        currentItem = { name, content: '' };
      } else if (currentItem) {
        // Add line to current item
        currentItem.content += line + '\n';
      }
    });

    // Add last item
    if (currentItem) {
      items.push(currentItem);
    }

    return items;
  };

  // Alias for backwards compatibility
  const parseCompetitiveAnalysis = parseSubsections;

  const sections = parseSections();

  // Filter out sidebar sections - they will be rendered separately in the sidebar
  // Also filter out empty sections when not in edit mode
  const regularSections = sections.filter(s => {
    // Check if this is a sidebar section
    const isSidebarSection = s.title === "Impact" || 
                            s.title === "Tools" ||
                            s.title === "At a glance" || 
                            s.title === "Tech stack";
    
    
    if (isSidebarSection) return false;
    
    // In edit mode, show all sections (even empty ones)
    if (isEditMode) return true;
    
    // In preview mode, only show sections with content
    const hasContent = s.content && s.content.trim().length > 0;
    return hasContent;
  });

  // Find key section indices
  const overviewIndex = regularSections.findIndex(s => s.title === "Overview");
  const solutionIndex = regularSections.findIndex(s => s.title.toLowerCase().includes("solution"));
  
  // Sections that should always render in decorative card style (not grid style)
  // Note: "Key features" is excluded here because it has special rendering (grid of cards)
  const decorativeCardSections = [
    "Overview",
    "The challenge",
    "My role",
    "Research insights",
    "Competitive analysis",
    "Solution highlights",
    "Key contributions"
  ];
  
  // Split into sections before and after "The Solution"
  // Include "Key features" explicitly (it has special rendering, not decorative card style)
  const beforeSolution = regularSections.filter(s => {
    const isDecorative = decorativeCardSections.some(dec => s.title.toLowerCase().includes(dec.toLowerCase()));
    const isSolution = s.title.toLowerCase().includes("solution");
    const isKeyFeatures = s.title.toLowerCase() === "key features";
    return isDecorative || isSolution || isKeyFeatures;
  });
  
  const afterSolutionRaw = regularSections.filter(s => {
    const isDecorative = decorativeCardSections.some(dec => s.title.toLowerCase().includes(dec.toLowerCase()));
    const isSolution = s.title.toLowerCase().includes("solution");
    return !isDecorative && !isSolution;
  });
  
  // Filter out specific sections we don't want in the grid
  const excludedSections = [
    "Key takeaway",
    "Design team",
    "Business and consumer impact"
  ];
  const afterSolution = afterSolutionRaw.filter(section => 
    !excludedSections.some(excluded => section.title.toLowerCase().includes(excluded.toLowerCase()))
  );
  
  // Build sections array with insertable items using configurable positions
  let sectionsWithInserts: Array<{ title: string; content: string; type?: 'section' | 'gallery' | 'sidebar' }> = [];
  
  // Create a list of all items with their positions
  const items = [
    ...beforeSolution.map((s, idx) => ({ ...s, type: 'section' as const, position: idx })),
  ];
  
  // CRITICAL: Collect all insertions and insert in DESCENDING order
  // This prevents index shifting issues when multiple sections are inserted
  const insertions: Array<{ 
    pos: number; 
    item: { title: string; content: string; type: 'section' | 'gallery' | 'sidebar'; position: number }
  }> = [];
  
  if (imageGallerySlot) {
    insertions.push({
      pos: projectImagesPosition,
      item: { 
        title: '__PROJECT_IMAGES__', 
        content: '', 
        type: 'gallery' as const,
        position: projectImagesPosition
      }
    });
  }
  
  if (videoSlot) {
    insertions.push({
      pos: videosPosition,
      item: { 
        title: '__VIDEOS__', 
        content: '', 
        type: 'gallery' as const,
        position: videosPosition
      }
    });
  }
  
  if (flowDiagramSlot) {
    insertions.push({
      pos: flowDiagramsPosition,
      item: { 
        title: '__FLOW_DIAGRAMS__', 
        content: '', 
        type: 'gallery' as const,
        position: flowDiagramsPosition
      }
    });
  }
  
  // Only insert Solution Cards when an explicit position is provided
  if ((afterSolution.length > 0 || isEditMode) && solutionCardsPosition !== undefined) {
    insertions.push({
      pos: solutionCardsPosition,
      item: { 
        title: '__SOLUTION_CARDS__', 
        content: '', 
        type: 'gallery' as const,
        position: solutionCardsPosition
      }
    });
  }
  
  // Sort by position ASCENDING (lowest position first)
  // This ensures sections appear in the correct order when using Math.min
  insertions.sort((a, b) => a.pos - b.pos);
  
  // Insert in order - each insertion pushes subsequent ones further down
  for (const insertion of insertions) {
    items.splice(Math.min(insertion.pos, items.length), 0, insertion.item);
  }
  
  // Add sidebars (always after Overview for mobile)
  if (overviewIndex >= 0 && atAGlanceSidebar) {
    items.splice(overviewIndex + 1, 0, { 
      title: '__AT_A_GLANCE__', 
      content: '', 
      type: 'sidebar' as const,
      position: overviewIndex + 1
    });
  }
  
  if (overviewIndex >= 0 && impactSidebar) {
    // Insert impact after at-a-glance if present, otherwise after overview
    const insertPos = atAGlanceSidebar ? overviewIndex + 2 : overviewIndex + 1;
    items.splice(insertPos, 0, { 
      title: '__IMPACT__', 
      content: '', 
      type: 'sidebar' as const,
      position: insertPos
    });
  }
  
  sectionsWithInserts = items;

  return (
    <div className="space-y-24">
      {/* Render sections before "The Solution" normally */}
      {sectionsWithInserts.map((section, index) => {
        // Render At a Glance sidebar (mobile only)
        if (section.title === '__AT_A_GLANCE__') {
          return (
            <div key="at-a-glance-mobile" className="lg:hidden">
              {atAGlanceSidebar}
            </div>
          );
        }
        
        // Render Project Images gallery with move buttons
        if (section.title === '__PROJECT_IMAGES__') {
          return (
            <div key="project-images-gallery" className="relative">
              {isEditMode && onMoveProjectImages && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 mb-6 bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 backdrop-blur-sm"
                >
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onMoveProjectImages('up')}
                      disabled={actualPositions ? actualPositions.projectImages === 0 : projectImagesPosition === 0}
                      className="rounded-full p-2"
                      title="Move Project Images section up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onMoveProjectImages('down')}
                      disabled={actualPositions ? actualPositions.projectImages >= (actualPositions.total - 1) : projectImagesPosition >= totalSections - 1}
                      className="rounded-full p-2"
                      title="Move Project Images section down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                      🖼️ Project Images Gallery
                    </span>
                  </div>
                  {onRemoveProjectImages && (
                    <Button size="sm" variant="destructive" onClick={() => onRemoveProjectImages()} className="rounded-full">Remove</Button>
                  )}
                </motion.div>
              )}
              {imageGallerySlot}
            </div>
          );
        }
        
        // Render Videos gallery with move buttons
        if (section.title === '__VIDEOS__') {
          return (
            <div key="videos-gallery" className="relative">
              {isEditMode && onMoveVideos && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 mb-6 bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 backdrop-blur-sm"
                >
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onMoveVideos('up')}
                      disabled={actualPositions ? actualPositions.videos === 0 : videosPosition === 0}
                      className="rounded-full p-2"
                      title="Move Videos section up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onMoveVideos('down')}
                      disabled={actualPositions ? actualPositions.videos >= (actualPositions.total - 1) : videosPosition >= totalSections - 1}
                      className="rounded-full p-2"
                      title="Move Videos section down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                      📹 Videos Gallery
                    </span>
                  </div>
                  {onRemoveVideos && (
                    <Button size="sm" variant="destructive" onClick={() => onRemoveVideos()} className="rounded-full">Remove</Button>
                  )}
                </motion.div>
              )}
              {videoSlot}
            </div>
          );
        }
        
        // Render Flow Diagrams gallery with move buttons
        if (section.title === '__FLOW_DIAGRAMS__') {
          return (
            <div key="flow-diagrams-gallery" className="relative">
              {isEditMode && onMoveFlowDiagrams && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 mb-6 bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 backdrop-blur-sm"
                >
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onMoveFlowDiagrams('up')}
                      disabled={actualPositions ? actualPositions.flowDiagrams === 0 : flowDiagramsPosition === 0}
                      className="rounded-full p-2"
                      title="Move Flow Diagrams section up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onMoveFlowDiagrams('down')}
                      disabled={actualPositions ? actualPositions.flowDiagrams >= (actualPositions.total - 1) : flowDiagramsPosition >= totalSections - 1}
                      className="rounded-full p-2"
                      title="Move Flow Diagrams section down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                      📊 Flow Diagrams Gallery
                    </span>
                  </div>
                  {onRemoveFlowDiagrams && (
                    <Button size="sm" variant="destructive" onClick={() => onRemoveFlowDiagrams()} className="rounded-full">Remove</Button>
                  )}
                </motion.div>
              )}
              {flowDiagramSlot}
            </div>
          );
        }
        
        // Render Impact sidebar (mobile only)
        if (section.title === '__IMPACT__') {
          return (
            <div key="impact-mobile" className="lg:hidden">
              {impactSidebar}
            </div>
          );
        }
        
        // Render Solution Cards grid
        if (section.title === '__SOLUTION_CARDS__') {
          return (
            <div key="solution-cards-grid" className="-mt-16">
              {/* Move buttons for entire grid section - only in edit mode */}
              {isEditMode && onMoveSolutionCards && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 mb-6 bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 backdrop-blur-sm"
                >
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onMoveSolutionCards('up')}
                      disabled={actualPositions ? actualPositions.solutionCards === 0 : solutionCardsPosition === 0}
                      className="rounded-full p-2"
                      title="Move cards section up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onMoveSolutionCards('down')}
                      disabled={actualPositions ? actualPositions.solutionCards >= (actualPositions.total - 1) : solutionCardsPosition >= totalSections - 1}
                      className="rounded-full p-2"
                      title="Move cards section down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                      💡 Solution Cards Grid
                    </span>
                  </div>
                  {onRemoveSolutionCards && (
                    <Button size="sm" variant="destructive" onClick={() => onRemoveSolutionCards()} className="rounded-full">Remove</Button>
                  )}
                </motion.div>
              )}
              
              {/* Add Card button - Always show in edit mode */}
              {isEditMode && (
                <div className="mb-6 flex justify-end">
                  <Button
                    onClick={addNewCard}
                    variant="outline"
                    size="sm"
                    className="rounded-full shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Card
                  </Button>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {afterSolution.map((cardSection, gridIndex) => {
                const config = getSectionConfig(cardSection.title);
                
                const isExpanded = expandedCards.has(gridIndex);
                
                // Create preview (first 4 lines to show title + bullets)
                const contentLines = cardSection.content.trim().split('\n').filter(line => line.trim());
                const previewLines = contentLines.slice(0, 4);
                const previewContent = previewLines.join('\n');
                const hasMore = contentLines.length > 4;

                return (
                  <motion.div
                    key={gridIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + gridIndex * 0.1 }}
                    whileHover={{ 
                      y: -6,
                      transition: { 
                        type: "spring", 
                        stiffness: 300, 
                        damping: 20 
                      }
                    }}
                    className="relative p-6 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md rounded-2xl border border-border/20 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                  >
                    {/* Gradient glow on hover */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 50% 50%, ${
                          config?.iconColor?.includes('blue') ? '#3b82f620' :
                          config?.iconColor?.includes('purple') ? '#8b5cf620' :
                          config?.iconColor?.includes('pink') ? '#ec489920' :
                          config?.iconColor?.includes('green') ? '#10b98120' :
                          config?.iconColor?.includes('yellow') ? '#fbbf2420' : '#3b82f620'
                        }, transparent 70%)`,
                      }}
                    />

                    {/* Content */}
                    <div className="relative z-10 flex flex-col">
                      {/* Header with Edit, Remove, and Move buttons */}
                      <div className="mb-4 flex items-center justify-between gap-2">
                        {isEditMode && editingSection === cardSection.title ? (
                          <div className="flex-1">
                            <label className="block text-xs font-medium mb-2">Card Title</label>
                            <Input
                              value={editedSectionTitle}
                              onChange={(e) => setEditedSectionTitle(e.target.value)}
                              className="text-lg font-bold"
                              placeholder="Card title..."
                            />
                          </div>
                        ) : (
                          <h3 className="text-lg flex-1">{cardSection.title}</h3>
                        )}
                        {isEditMode && editingSection !== cardSection.title && (
                          <div className="flex gap-1.5">
                            {/* Move up/down arrows */}
                            {gridIndex > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => moveSectionUp(cardSection.title)}
                                className="rounded-full p-2"
                                title="Move card up"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </Button>
                            )}
                            {gridIndex < afterSolution.length - 1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => moveSectionDown(cardSection.title)}
                                className="rounded-full p-2"
                                title="Move card down"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditingSection(cardSection.title, cardSection.content)}
                              className="rounded-full"
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeCard(cardSection.title)}
                              className="rounded-full"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Card content */}
                      {isEditMode && editingSection === cardSection.title ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-medium mb-2">Card Content</label>
                            <Textarea
                              value={editedSectionContent}
                              onChange={(e) => setEditedSectionContent(e.target.value)}
                              className="min-h-[200px] font-mono text-sm"
                              placeholder="Add content here... (Markdown supported)"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelSectionEdit}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => saveSectionEdit(cardSection.title)}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Preview content - always visible */}
                          <div className="text-muted-foreground text-sm mb-2">
                            <MarkdownRenderer content={previewContent} variant="compact" />
                          </div>
                          
                          {/* Expanded content - conditionally visible */}
                          {hasMore && (
                            <motion.div
                              initial={false}
                              animate={{
                                height: isExpanded ? "auto" : 0,
                                opacity: isExpanded ? 1 : 0,
                                marginTop: isExpanded ? 12 : 0
                              }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="text-muted-foreground text-sm">
                                <MarkdownRenderer content={contentLines.slice(4).join('\n')} variant="compact" />
                              </div>
                            </motion.div>
                          )}
                          
                          {/* Show more/less button */}
                          {hasMore && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCard(gridIndex);
                                e.currentTarget.blur();
                              }}
                              className="mt-3 flex items-center gap-1 text-sm font-medium transition-all relative cursor-pointer hover:translate-x-0.5"
                            >
                              <motion.span
                                className="inline-block"
                                animate={{
                                  backgroundImage: [
                                    "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
                                    "linear-gradient(180deg, #8b5cf6 0%, #ec4899 50%, #3b82f6 100%)",
                                    "linear-gradient(225deg, #ec4899 0%, #3b82f6 50%, #8b5cf6 100%)",
                                    "linear-gradient(270deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
                                    "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
                                  ],
                                }}
                                transition={{
                                  duration: 8,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                                style={{
                                  backgroundClip: "text",
                                  WebkitBackgroundClip: "text",
                                  WebkitTextFillColor: "transparent",
                                }}
                              >
                                {isExpanded ? "Show less" : "Show more"}
                              </motion.span>
                              {isExpanded ? (
                                <ChevronUp className={`w-4 h-4 ${config?.iconColor || 'text-blue-500'}`} />
                              ) : (
                                <ChevronDown className={`w-4 h-4 ${config?.iconColor || 'text-blue-500'}`} />
                              )}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                );
                })}
              </div>
            </div>
          );
        }
        
        const config = getSectionConfig(section.title);

        const Icon = config?.icon;

        // Special handling for My role & impact section (also matches "My role")
        if (section.title.toLowerCase().includes("my role")) {
          
          // Parse subsections (## Leadership, ## Design, ## Research, etc.)
          const subsectionRegex = /## (.+?)(?=\n##|\n#|$)/gs;
          const subsections: Array<{ title: string; content: string }> = [];
          let match;
          
          while ((match = subsectionRegex.exec(section.content)) !== null) {
            const title = (match[1] || '').split('\n')[0].trim();
            const content = (match[1] || '').substring(title.length).trim();
            // Add section even if content is empty - we'll handle it in rendering
            subsections.push({ title, content: content || '(No content yet - add bullets in edit mode)' });
          }
          
          
          // Icon mapping for specific subsection names
          const iconMap: Record<string, any> = {
            'Leadership': Users,
            'Design': Rocket,
            'Research': Lightbulb,
            'Strategy': Target,
            'Innovation': Award
          };
          
          const colorMap: Record<string, string> = {
            'Leadership': "text-purple-600 dark:text-purple-400",
            'Design': "text-blue-600 dark:text-blue-400",
            'Research': "text-pink-600 dark:text-pink-400",
            'Strategy': "text-green-600 dark:text-green-400",
            'Innovation': "text-yellow-600 dark:text-yellow-400"
          };
          
          // Determine which card has the most content (will go on top)
          const cardSizes = subsections.map((sub, idx) => ({
            index: idx,
            size: sub.content.length
          }));
          cardSizes.sort((a, b) => b.size - a.size);
          const largestCardIndex = cardSizes[0]?.index ?? 0;

          // Split cards: largest first, then remaining
          const largestCard = subsections[largestCardIndex];
          const otherCards = subsections.filter((_, idx) => idx !== largestCardIndex);

          // Helper function to render a single card
          const renderRoleCard = (subsection: { title: string; content: string }, cardKey: string) => {
            const SubIcon = iconMap[subsection.title] || Target;
            const iconColor = colorMap[subsection.title] || "text-blue-600 dark:text-blue-400";
            
            return (
              <motion.div
                key={cardKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ 
                  y: -8, 
                  scale: 1.01,
                  transition: { 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 25 
                  }
                }}
                className="relative p-6 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md rounded-2xl border border-border/20 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                style={{
                  transform: 'translateZ(0)',
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Animated decorative curved line */}
                <svg
                  className="absolute right-0 top-0 h-full w-[35%] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  viewBox="0 0 100 200"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <motion.path
                    d="M60,-20 Q70,30 75,80 Q80,130 85,180"
                    fill="none"
                    stroke={
                      iconColor.includes('purple') ? '#8b5cf6' :
                      iconColor.includes('blue') ? '#3b82f6' :
                      iconColor.includes('pink') ? '#ec4899' :
                      iconColor.includes('green') ? '#10b981' : '#fbbf24'
                    }
                    strokeWidth="18"
                    strokeLinecap="round"
                    className="group-hover:animate-[drawLine_2s_ease-in-out_forwards]"
                    style={{
                      opacity: 0,
                      strokeDasharray: 1000,
                      strokeDashoffset: 1000,
                    }}
                  />
                </svg>

                {/* Bouncy decorative dots */}
                {[
                  { x: '75%', y: '20%', size: 6, delay: 0 },
                  { x: '85%', y: '45%', size: 5, delay: 0.1 },
                  { x: '80%', y: '75%', size: 7, delay: 0.2 },
                  { x: '90%', y: '30%', size: 5, delay: 0.15 },
                  { x: '78%', y: '60%', size: 6, delay: 0.25 },
                ].map((dot, dotIndex) => (
                  <motion.div
                    key={dotIndex}
                    className="absolute rounded-full pointer-events-none opacity-0 scale-0 group-hover:animate-[bounceDot_1.5s_ease-out_forwards]"
                    style={{
                      left: dot.x,
                      top: dot.y,
                      width: `${dot.size}px`,
                      height: `${dot.size}px`,
                      background: iconColor.includes('purple') ? '#8b5cf6' :
                                 iconColor.includes('blue') ? '#3b82f6' :
                                 iconColor.includes('pink') ? '#ec4899' :
                                 iconColor.includes('green') ? '#10b981' : '#fbbf24',
                      boxShadow: `0 0 ${dot.size * 2}px ${
                        iconColor.includes('purple') ? '#8b5cf6' :
                        iconColor.includes('blue') ? '#3b82f6' :
                        iconColor.includes('pink') ? '#ec4899' :
                        iconColor.includes('green') ? '#10b981' : '#fbbf24'
                      }40`,
                      animationDelay: `${dot.delay}s`,
                    }}
                  />
                ))}

                {/* Gradient glow effect on hover */}
                <motion.div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${
                      iconColor.includes('purple') ? '#8b5cf620' :
                      iconColor.includes('blue') ? '#3b82f620' :
                      iconColor.includes('pink') ? '#ec489920' :
                      iconColor.includes('green') ? '#10b98120' : '#fbbf2420'
                    }, transparent 70%)`,
                  }}
                />

                {/* Content with z-depth */}
                <div className="relative z-10 flex flex-col">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div 
                      className={`p-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl ${iconColor} shadow-md transition-all duration-300 group-hover:shadow-xl flex-shrink-0`}
                      style={{ transform: 'translateZ(10px)' }}
                    >
                      <SubIcon className="w-5 h-5" />
                    </motion.div>
                    <h3 className="text-lg">{subsection.title}</h3>
                  </div>
                  
                  {/* Full content - always visible */}
                  <div className="text-muted-foreground">
                    <MarkdownRenderer content={subsection.content.trim()} variant="compact" />
                  </div>
                </div>
              </motion.div>
            );
          };

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.08 }}
            >
              {/* Section Header */}
              <div className="mb-8 flex items-center justify-between">
                <h2>{section.title}</h2>
                {isEditMode && editingSection !== section.title && (
                  <div className="flex gap-2">
                    {/* Move up/down arrows */}
                    {index > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveSectionUp(section.title)}
                        className="rounded-full p-2"
                        title="Move section up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                    )}
                    {index < sectionsWithInserts.length - 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveSectionDown(section.title)}
                        className="rounded-full p-2"
                        title="Move section down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditingSection(section.title, section.content)}
                      className="rounded-full"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Cards
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeCard(section.title)}
                      className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete this section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Editable or Display Mode */}
              {isEditMode && editingSection === section.title ? (
                <div className="space-y-4 bg-card/50 p-6 rounded-xl border border-border">
                  <Textarea
                    value={editedSectionContent}
                    onChange={(e) => setEditedSectionContent(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                    placeholder="Enter role & impact content in Markdown format...&#10;&#10;Example:&#10;## Leadership&#10;- Led cross-functional team&#10;- Drove strategic decisions&#10;&#10;## Design&#10;- Created design system&#10;- Implemented user flows"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelSectionEdit}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveSectionEdit(section.title)}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                /* Layout: One large card on top, two smaller cards below */
                <div className="space-y-6">
                  {/* Largest Card - Full Width on Top */}
                  {largestCard && renderRoleCard(largestCard, 'largest-card')}
                  
                  {/* Remaining Cards - Two Column Grid */}
                  {otherCards.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {otherCards.map((card, idx) => renderRoleCard(card, `other-card-${idx}`))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        }

        // Special handling for Research Insights section
        if (section.title === "Research insights") {
          // Parse insights from ## subsections (same as competitive analysis)
          const parsedInsights = parseSubsections(section.content);
          const insights = parsedInsights.map(item => ({
            title: item.name,
            description: item.content.trim()
          }));

          // If no insights parsed, don't render the section
          if (insights.length === 0) {
            console.warn('Research insights section has no parsed insights', {
              contentLength: section.content?.length || 0,
              contentPreview: section.content?.substring(0, 200)
            });
            return null;
          }


          const insightIcons = [Compass, Camera, MessageSquare, CheckCircle, AlertCircle];

          const insightGradients = [
            "linear-gradient(135deg, #ec4899, #fbbf24)",
            "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            "linear-gradient(135deg, #10b981, #06b6d4)",
            "linear-gradient(135deg, #fbbf24, #ec4899)",
            "linear-gradient(135deg, #8b5cf6, #ec4899)"
          ];

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.08 }}
            >
              {/* Section Header */}
              <div className="mb-8 flex items-center justify-between">
                <h2>{section.title}</h2>
                {isEditMode && editingSection !== section.title && (
                  <div className="flex gap-2">
                    {/* Move up/down arrows */}
                    {index > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveSectionUp(section.title)}
                        className="rounded-full p-2"
                        title="Move section up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                    )}
                    {index < sectionsWithInserts.length - 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveSectionDown(section.title)}
                        className="rounded-full p-2"
                        title="Move section down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditingSection(section.title, section.content)}
                      className="rounded-full"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Insights
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeCard(section.title)}
                      className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete this section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Editable or Display Mode */}
              {isEditMode && editingSection === section.title ? (
                <div className="space-y-4 bg-card/50 p-6 rounded-xl border border-border">
                  <Textarea
                    value={editedSectionContent}
                    onChange={(e) => setEditedSectionContent(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                    placeholder={'Enter research insights in Markdown format...\\n\\nExample:\\n## User needs\\nDescription of user needs\\n\\n## Pain points\\nDescription of pain points'}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelSectionEdit}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveSectionEdit(section.title)}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                /* Insights Cards Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {insights.map((insight, insightIndex) => {
                  const InsightIcon = insightIcons[insightIndex % insightIcons.length];
                  const gradient = insightGradients[insightIndex % insightGradients.length];
                  
                  return (
                    <motion.div
                      key={insightIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + insightIndex * 0.1 }}
                      whileHover={{ 
                        y: -8,
                        scale: 1.02,
                        transition: { 
                          type: "spring", 
                          stiffness: 300, 
                          damping: 20 
                        }
                      }}
                      className="relative p-6 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md rounded-xl border border-border/30 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
                    >
                      {/* Top gradient accent */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                        style={{
                          background: gradient
                        }}
                      />

                      {/* Gradient glow on hover */}
                      <motion.div
                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at 50% 50%, ${
                            gradient.includes('#ec4899') ? '#ec489915' : 
                            gradient.includes('#3b82f6') ? '#3b82f615' :
                            gradient.includes('#10b981') ? '#10b98115' :
                            gradient.includes('#fbbf24') ? '#fbbf2415' : '#8b5cf615'
                          }, transparent 70%)`,
                        }}
                      />

                      {/* Content */}
                      <div className="relative z-10">
                        <h4 className="mb-2">{insight.title}</h4>
                        {insight.description && (
                          <p className="text-muted-foreground leading-relaxed">
                            {insight.description}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              )}
            </motion.div>
          );
        }

        // Special handling for Solution highlights section (titleless, 3 cards in a row)
        if (section.title === "Solution highlights") {
          const highlights = parseSubsections(section.content);
          const highlightCards = highlights.map(item => ({
            title: item.name,
            description: item.content.trim()
          }));

          if (highlightCards.length === 0) {
            return null;
          }

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.08 }}
            >
              {/* NO TITLE - Hidden title section for editing only */}
              {isEditMode && (
                <div className="mb-4 flex items-center justify-between opacity-50">
                  <h3 className="text-sm text-muted-foreground italic">{section.title} (title hidden in preview)</h3>
                  {editingSection !== section.title && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditingSection(section.title, section.content)}
                        className="rounded-full"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCard(section.title)}
                        className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete this section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Editable or Display Mode */}
              {isEditMode && editingSection === section.title ? (
                <div className="space-y-4 bg-card/50 p-6 rounded-xl border border-border">
                  <Textarea
                    value={editedSectionContent}
                    onChange={(e) => setEditedSectionContent(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                    placeholder={'Enter highlights...\\n\\nExample:\\n## Feature name\\nShort description'}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelSectionEdit}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveSectionEdit(section.title)}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                /* 3 Cards in a Single Row */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {highlightCards.map((highlight, idx) => {
                    const gradient = "linear-gradient(135deg, #10b981, #06b6d4)";
                    
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + idx * 0.1 }}
                        whileHover={{ 
                          y: -8,
                          scale: 1.02,
                          transition: { duration: 0.2 }
                        }}
                        className="group relative p-8 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md rounded-2xl border border-border/30 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                        style={{
                          transform: 'translateZ(0)',
                          willChange: 'transform'
                        }}
                      >
                        {/* Gradient Glow Effect */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                          style={{
                            background: `radial-gradient(circle at 50% 0%, ${
                              gradient.includes('green') ? '#10b98120' : 
                              gradient.includes('blue') ? '#3b82f620' : 
                              gradient.includes('purple') ? '#8b5cf620' : 
                              gradient.includes('pink') ? '#ec489920' : 
                              gradient.includes('yellow') ? '#fbbf2420' : '#10b98120'
                            }, transparent 70%)`,
                          }}
                        />

                        {/* Content with z-depth */}
                        <div className="relative z-10 flex flex-col">
                          {/* Header */}
                          <div className="flex items-center gap-3 mb-4">
                            <motion.div 
                              className="p-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl text-emerald-600 dark:text-emerald-400 shadow-md transition-all duration-300 group-hover:shadow-xl flex-shrink-0"
                              style={{ transform: 'translateZ(10px)' }}
                            >
                              <CheckCircle className="w-5 h-5" />
                            </motion.div>
                            <h3 className="text-lg">{highlight.title}</h3>
                          </div>
                          
                          {/* Content */}
                          <div className="text-muted-foreground text-sm">
                            <MarkdownRenderer content={highlight.description} variant="compact" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          );
        }

        // Special handling for Key features section (3 cards in a row with solution colors)
        if (section.title === "Key features") {
          const features = parseSubsections(section.content);
          const featureCards = features.map(item => ({
            title: item.name,
            description: item.content.trim()
          }));

          if (featureCards.length === 0) {
            return null;
          }

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.08 }}
            >
              {/* Section Header */}
              <div className="mb-8 flex items-center justify-between">
                <h2>{section.title}</h2>
                {isEditMode && editingSection !== section.title && (
                  <div className="flex gap-2 items-center">
                    {onKeyFeaturesColumnsChange && (
                      <div className="flex gap-1 mr-2">
                        <Button
                          size="sm"
                          variant={keyFeaturesColumns === 2 ? "default" : "outline"}
                          onClick={() => onKeyFeaturesColumnsChange(2)}
                          className="rounded-full"
                          title="2x2 Layout"
                        >
                          2×2
                        </Button>
                        <Button
                          size="sm"
                          variant={keyFeaturesColumns === 3 ? "default" : "outline"}
                          onClick={() => onKeyFeaturesColumnsChange(3)}
                          className="rounded-full"
                          title="3x3 Layout"
                        >
                          3×3
                        </Button>
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditingSection(section.title, section.content)}
                      className="rounded-full"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Features
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeCard(section.title)}
                      className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete this section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Editable or Display Mode */}
              {isEditMode && editingSection === section.title ? (
                <div className="space-y-4 bg-card/50 p-6 rounded-xl border border-border">
                  <Textarea
                    value={editedSectionContent}
                    onChange={(e) => setEditedSectionContent(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                    placeholder={'Enter key features...\\n\\nExample:\\n## Feature name\\nDescription of this key feature'}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelSectionEdit}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveSectionEdit(section.title)}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                /* Feature Cards with configurable columns (2x2 or 3x3) */
                <div className={`grid grid-cols-1 gap-6 ${keyFeaturesColumns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                  {featureCards.map((feature, idx) => {
                    const gradient = "linear-gradient(135deg, #10b981, #06b6d4)";
                    
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + idx * 0.1 }}
                        whileHover={{ 
                          y: -8,
                          scale: 1.02,
                          transition: { duration: 0.2 }
                        }}
                        className="group relative p-8 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md rounded-2xl border border-border/30 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                        style={{
                          transform: 'translateZ(0)',
                          willChange: 'transform'
                        }}
                      >
                        {/* Gradient Glow Effect */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                          style={{
                            background: `radial-gradient(circle at 50% 0%, #10b98120, transparent 70%)`,
                          }}
                        />

                        {/* Content with z-depth */}
                        <div className="relative z-10 flex flex-col">
                          {/* Header - No icon */}
                          <h3 className="text-lg mb-4">{feature.title}</h3>
                          
                          {/* Content */}
                          <div className="text-muted-foreground text-sm">
                            <MarkdownRenderer content={feature.description} variant="compact" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          );
        }

        // Special handling for Competitive Analysis section
        if (section.title === "Competitive analysis") {
          const competitors = parseCompetitiveAnalysis(section.content);
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.08 }}
            >
              {/* Section Header */}
              <div className="mb-8 flex items-center justify-between">
                <h2>{section.title}</h2>
                {isEditMode && editingSection !== section.title && (
                  <div className="flex gap-2">
                    {/* Move up/down arrows */}
                    {index > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveSectionUp(section.title)}
                        className="rounded-full p-2"
                        title="Move section up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                    )}
                    {index < sectionsWithInserts.length - 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveSectionDown(section.title)}
                        className="rounded-full p-2"
                        title="Move section down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditingSection(section.title, section.content)}
                      className="rounded-full"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Analysis
                    </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeCard(section.title)}
                    className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Delete this section"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  </div>
                )}
              </div>

              {/* Editable or Display Mode */}
              {isEditMode && editingSection === section.title ? (
                <div className="space-y-4 bg-card/50 p-6 rounded-xl border border-border">
                  <Textarea
                    value={editedSectionContent}
                    onChange={(e) => setEditedSectionContent(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                    placeholder={'Enter competitive analysis in Markdown format...\\n\\nExample:\\n## Competitor A\\nDescription\\n\\n## Competitor B\\nDescription'}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelSectionEdit}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveSectionEdit(section.title)}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                /* Competitor Cards Grid - All visible with expandable content */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {competitors.map((competitor, compIndex) => {
                  const competitorKey = 8000 + compIndex; // Unique key for each competitor
                  const isExpanded = expandedCards.has(competitorKey);
                  
                  // Get first line as preview (usually the competitor name/description)
                  const contentLines = competitor.content.trim().split('\n').filter(line => line.trim());
                  const previewLines = contentLines.slice(0, 2);
                  const previewContent = previewLines.join('\n');
                  const hasMore = contentLines.length > 2;
                  
                  return (
                    <motion.div
                      key={compIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + compIndex * 0.1 }}
                      whileHover={{ 
                        y: -6,
                        transition: { 
                          type: "spring", 
                          stiffness: 300, 
                          damping: 20 
                        }
                      }}
                      className="relative p-6 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md rounded-xl border border-border/30 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
                    >
                      {/* Subtle gradient accent on left */}
                      <div 
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                        style={{
                          background: config?.gradient || '#3b82f6'
                        }}
                      />

                      {/* Gradient glow on hover */}
                      <motion.div
                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at 50% 50%, ${
                            config.gradient.includes('#fbbf24') ? '#fbbf2415' : '#3b82f615'
                          }, transparent 70%)`,
                        }}
                      />

                      {/* Competitor content */}
                      <div className="relative z-10">
                        <h3 className="mb-3 text-lg">{competitor.name}</h3>
                        
                        {/* Preview content - always visible */}
                        <div className="text-muted-foreground text-sm">
                          <MarkdownRenderer content={previewContent} variant="compact" />
                        </div>
                        
                        {/* Expanded content - conditionally visible */}
                        {hasMore && (
                          <motion.div
                            initial={false}
                            animate={{
                              height: isExpanded ? "auto" : 0,
                              opacity: isExpanded ? 1 : 0,
                              marginTop: isExpanded ? 12 : 0
                            }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="text-muted-foreground text-sm">
                              <MarkdownRenderer content={contentLines.slice(2).join('\n')} variant="compact" />
                            </div>
                          </motion.div>
                        )}
                        
                        {/* View more button */}
                        {hasMore && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCard(competitorKey);
                              e.currentTarget.blur(); // Remove focus after click
                            }}
                            className="mt-3 flex items-center gap-1 text-sm font-medium transition-all relative cursor-pointer hover:translate-x-0.5"
                          >
                            <motion.span
                              className="inline-block"
                              animate={{
                                backgroundImage: [
                                  "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
                                  "linear-gradient(180deg, #8b5cf6 0%, #ec4899 50%, #3b82f6 100%)",
                                  "linear-gradient(225deg, #ec4899 0%, #3b82f6 50%, #8b5cf6 100%)",
                                  "linear-gradient(270deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
                                  "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
                                ],
                              }}
                              transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              style={{
                                backgroundClip: "text",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                              }}
                            >
                              {isExpanded ? "Show less" : "Show more"}
                            </motion.span>
                            {isExpanded ? (
                              <ChevronUp className={`w-4 h-4 ${config?.iconColor || 'text-blue-500'}`} />
                            ) : (
                              <ChevronDown className={`w-4 h-4 ${config?.iconColor || 'text-blue-500'}`} />
                            )}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              )}
            </motion.div>
          );
        }

        // Regular section rendering
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.08 }}
            whileHover={{ 
              y: -8,
              transition: { 
                type: "spring", 
                stiffness: 300, 
                damping: 20 
              }
            }}
            className="relative p-8 md:p-10 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/30 dark:via-slate-900/25 dark:to-slate-800/20 backdrop-blur-md rounded-2xl border border-border/30 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
          >
            {/* Gradient top border */}
            <div 
              className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
              style={{
                background: config?.gradient || '#3b82f6'
              }}
            />

            {/* Animated decorative curved line */}
            <svg
              className="absolute right-0 top-0 h-full w-[25%] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              viewBox="0 0 100 200"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.path
                d="M60,-20 Q70,30 75,80 Q80,130 85,180"
                fill="none"
                stroke={config?.gradient?.includes('#ec4899') ? '#ec4899' : 
                       config?.gradient?.includes('#8b5cf6') ? '#8b5cf6' :
                       config?.gradient?.includes('#fbbf24') ? '#fbbf24' :
                       config?.gradient?.includes('#10b981') ? '#10b981' : '#3b82f6'}
                strokeWidth="18"
                strokeLinecap="round"
                className="group-hover:animate-[drawLine_2s_ease-in-out_forwards]"
                style={{
                  opacity: 0,
                  strokeDasharray: 1000,
                  strokeDashoffset: 1000,
                }}
              />
            </svg>

            {/* Bouncy dots */}
            {[
              { x: '85%', y: '20%', size: 6, delay: 0 },
              { x: '90%', y: '50%', size: 7, delay: 0.1 },
              { x: '88%', y: '80%', size: 5, delay: 0.2 },
            ].map((dot, dotIndex) => (
              <motion.div
                key={dotIndex}
                className="absolute rounded-full pointer-events-none opacity-0 scale-0 group-hover:animate-[bounceDot_1.5s_ease-out_forwards]"
                style={{
                  left: dot.x,
                  top: dot.y,
                  width: `${dot.size}px`,
                  height: `${dot.size}px`,
                  background: config.gradient.includes('#ec4899') ? '#ec4899' : 
                             config.gradient.includes('#8b5cf6') ? '#8b5cf6' :
                             config.gradient.includes('#fbbf24') ? '#fbbf24' :
                             config.gradient.includes('#10b981') ? '#10b981' : '#3b82f6',
                  boxShadow: `0 0 ${dot.size * 2}px ${config.gradient.includes('#ec4899') ? '#ec489940' : 
                             config.gradient.includes('#8b5cf6') ? '#8b5cf640' :
                             config.gradient.includes('#fbbf24') ? '#fbbf2440' :
                             config.gradient.includes('#10b981') ? '#10b98140' : '#3b82f640'}`,
                  animationDelay: `${dot.delay}s`,
                }}
              />
            ))}

            {/* Gradient glow on hover */}
            <motion.div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${
                  config.gradient.includes('#ec4899') ? '#ec489920' : 
                  config.gradient.includes('#8b5cf6') ? '#8b5cf620' :
                  config.gradient.includes('#fbbf24') ? '#fbbf2420' :
                  config.gradient.includes('#10b981') ? '#10b98120' : '#3b82f620'
                }, transparent 70%)`,
              }}
            />

            {/* Subtle background pattern */}
            <div 
              className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none rounded-2xl"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 1px)`,
                backgroundSize: '24px 24px'
              }}
            />

            {/* Section header */}
            <div className="mb-8 relative z-10 flex items-center justify-between">
              <h2>{section.title}</h2>
              {isEditMode && editingSection !== section.title && (
                <div className="flex gap-2">
                  {/* Move up/down arrows */}
                  {index > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveSectionUp(section.title)}
                      className="rounded-full p-2"
                      title="Move section up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                  )}
                  {index < sectionsWithInserts.length - 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveSectionDown(section.title)}
                      className="rounded-full p-2"
                      title="Move section down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEditingSection(section.title, section.content)}
                    className="rounded-full"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeCard(section.title)}
                    className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Delete this section"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Section header - Editable or Display */}
            {isEditMode && editingSection === section.title ? (
              <div className="mb-8 relative z-10">
                <label className="block text-sm font-medium mb-2">Section Title</label>
                <Input
                  value={editedSectionTitle}
                  onChange={(e) => setEditedSectionTitle(e.target.value)}
                  className="text-2xl font-bold"
                  placeholder="Section title..."
                />
              </div>
            ) : null}

            {/* Section content - Editable or Display */}
            <div className="relative z-10">
              {isEditMode && editingSection === section.title ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Section Content (Markdown)</label>
                    <Textarea
                      value={editedSectionContent}
                      onChange={(e) => setEditedSectionContent(e.target.value)}
                      className="min-h-[300px] font-mono text-sm"
                      placeholder="Enter section content in Markdown format..."
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelSectionEdit}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveSectionEdit(section.title)}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <MarkdownRenderer content={section.content.trim()} />
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default CaseStudySections;
