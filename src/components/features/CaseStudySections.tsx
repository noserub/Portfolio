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
  latestProjectContent?: string; // Latest saved project content for accurate card counting
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
  researchInsightsColumns?: 1 | 2 | 3;
  onResearchInsightsColumnsChange?: (columns: 1 | 2 | 3) => void;
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
  latestProjectContent,
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
  onKeyFeaturesColumnsChange,
  researchInsightsColumns = 3,
  onResearchInsightsColumnsChange
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

    // CRITICAL: Use latestProjectContent as the base, not content
    // content is cleaned/filtered and may be missing cards, but latestProjectContent has all saved cards
    const contentToEdit = latestProjectContent || content;

    // Replace the section title and content in the full content
    const lines = contentToEdit.split('\n');
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
    console.log('🚀 addNewCard called!', { hasOnContentUpdate: !!onContentUpdate, contentLength: content?.length, latestProjectContentLength: latestProjectContent?.length });
    
    if (!onContentUpdate) {
      console.error('No onContentUpdate callback provided');
      return;
    }

    // CRITICAL: Use latestProjectContent as the BASE for all operations, not content
    // content is cleaned/filtered and may be missing cards, but latestProjectContent has all saved cards
    const contentForCounting = latestProjectContent || content;
    const linesForCounting = contentForCounting.split('\n');
    console.log('📄 Content for counting lines:', linesForCounting.length, '| Using:', latestProjectContent ? 'latestProjectContent' : 'content');
    
    // Find "The solution" section and insert the new card right after it
    // Use latestProjectContent as the base, not content (which may be missing cards)
    const lines = (latestProjectContent || content).split('\n');
    console.log('📄 Initial content lines:', lines.length, '| Using:', latestProjectContent ? 'latestProjectContent (has all cards)' : 'content (may be missing cards)');
    
    // FIRST: Count existing "New Card" sections from LATEST PROJECT CONTENT (before any cleanup)
    // This is critical - we need to know what cards exist in the saved data before we modify anything
    const newCardPattern = /^#\s+New Card (\d+)/i;
    let maxCardNumber = 0;
    const foundCards: number[] = [];
    const matchingLines: string[] = [];
    for (let i = 0; i < linesForCounting.length; i++) {
      const line = linesForCounting[i];
      const trimmed = line.trim();
      const match = trimmed.match(newCardPattern);
      if (match) {
        const cardNumber = parseInt(match[1], 10);
        foundCards.push(cardNumber);
        matchingLines.push(`Line ${i}: "${trimmed}" -> Card ${cardNumber}`);
        if (cardNumber > maxCardNumber) {
          maxCardNumber = cardNumber;
        }
      }
    }
    
    // Also check for any header that contains "New Card" (case insensitive) to see if we're missing something
    const anyNewCardHeaders = linesForCounting
      .map((line, i) => {
        const trimmed = line.trim();
        const headerMatch = trimmed.match(/^#\s+(.+)$/);
        if (headerMatch) {
          const title = headerMatch[1];
          if (title.toLowerCase().includes('new card')) {
            return `Line ${i}: "${trimmed}"`;
          }
        }
        return null;
      })
      .filter(Boolean);
    
    console.log('🔢 Found existing cards in original content:', { 
      foundCards, 
      maxCardNumber, 
      nextCardNumber: maxCardNumber + 1,
      matchingLines,
      anyNewCardHeaders: anyNewCardHeaders.length > 0 ? anyNewCardHeaders : 'none'
    });
    
    const newLines: string[] = [];
    let foundSolutionSection = false;
    let cardInserted = false;
    let solutionSectionEndIndex = -1;
    let solutionSectionStartIndex = -1;
    
    // First pass: find "The solution" section (exact match or "The solution: ...") and where it ends
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headerMatch = line.trim().match(/^#\s+(.+)$/);
      
      if (headerMatch) {
        const title = headerMatch[1].trim();
        const titleLower = title.toLowerCase();
        
        // Check if this is "The solution" section (exact match or starts with "The solution")
        // But not "Solution cards" or "New Card"
        if (titleLower === 'the solution' || (titleLower.startsWith('the solution') && !titleLower.includes('cards') && !titleLower.includes('new card'))) {
          if (!foundSolutionSection) {
            foundSolutionSection = true;
            solutionSectionStartIndex = i;
          }
        } else if (foundSolutionSection && solutionSectionStartIndex >= 0) {
          // Found the next section after "The solution" - mark where to insert
          solutionSectionEndIndex = i;
          break;
        }
      }
    }
    
    // If we didn't find another section, the solution section goes to the end
    if (foundSolutionSection && solutionSectionEndIndex === -1) {
      solutionSectionEndIndex = lines.length;
    }
    
    // Cleanup pass: Remove any orphaned "New Card" content inside the solution section
    // AND remove duplicate consecutive "The solution: A new direction" headers
    // This content appears without a proper header and should be removed
    const cleanedLines: string[] = [];
    let inSolutionSection = false;
    let skipOrphanedContent = false;
    // Match lines that look like default "New Card" content (with or without "- " prefix)
    let orphanedContentPattern = /^(\s*-\s*)?(Add content for|You can use Markdown formatting|Bullet points|\*\*Bold text\*\*|\*Italic text\*)/i;
    let foundSolutionInCleanup = false;
    let solutionStartInCleanup = -1;
    let lastSolutionHeader = ''; // Track the last solution header to detect duplicates
    let lastSolutionHeaderIndex = -1; // Track where we saw it
    let duplicateSolutionHeaderSkipped = false; // Track if we're skipping a duplicate
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headerMatch = line.trim().match(/^#\s+(.+)$/);
      
      if (headerMatch) {
        const title = headerMatch[1].trim();
        const titleLower = title.toLowerCase();
        
        // Check if this is a duplicate solution header (consecutive duplicate)
        const isSolutionHeader = titleLower === 'the solution' || (titleLower.startsWith('the solution') && !titleLower.includes('cards') && !titleLower.includes('new card'));
        if (isSolutionHeader && lastSolutionHeader === title && lastSolutionHeaderIndex >= 0) {
          // Check if this is a duplicate by looking at the gap between headers
          // If there are only blank lines between them, it's a duplicate
          let onlyBlankLines = true;
          for (let j = lastSolutionHeaderIndex + 1; j < i; j++) {
            if (lines[j].trim() !== '') {
              onlyBlankLines = false;
              break;
            }
          }
          if (onlyBlankLines) {
            // This is a duplicate consecutive solution header - skip it
            console.log('🚫 Skipping duplicate solution header at line', i, ':', title);
            duplicateSolutionHeaderSkipped = true;
            inSolutionSection = true; // Stay in solution section
            // IMPORTANT: Don't update lastSolutionHeaderIndex - the original is still the last one we saw
            // But we do need to reset duplicateSolutionHeaderSkipped flag after processing
            continue; // Skip this duplicate header
          }
        }
        
        // Reset duplicate tracking if we see a different header
        if (!isSolutionHeader) {
          duplicateSolutionHeaderSkipped = false;
        }
        
        // Check if we're entering the solution section
        if (isSolutionHeader) {
          inSolutionSection = true;
          skipOrphanedContent = false;
          foundSolutionInCleanup = true;
          solutionStartInCleanup = i;
          lastSolutionHeader = title; // Track this solution header
          lastSolutionHeaderIndex = i;
          cleanedLines.push(line);
        } 
        // If we see a proper "New Card" header, it's valid - always preserve it
        else if (titleLower.startsWith('new card')) {
          inSolutionSection = false; // New Card headers are outside solution section
          skipOrphanedContent = false;
          lastSolutionHeader = ''; // Reset solution header tracking
          lastSolutionHeaderIndex = -1;
          cleanedLines.push(line);
        }
        // Check if we're leaving the solution section (any header after solution)
        else if (inSolutionSection && foundSolutionInCleanup && solutionStartInCleanup >= 0 && i > solutionStartInCleanup) {
          inSolutionSection = false;
          skipOrphanedContent = false;
          lastSolutionHeader = ''; // Reset solution header tracking
          lastSolutionHeaderIndex = -1;
          cleanedLines.push(line);
        }
        else {
          lastSolutionHeader = ''; // Reset solution header tracking
          lastSolutionHeaderIndex = -1;
          cleanedLines.push(line);
        }
      } else {
        // Non-header line
        const trimmedLine = line.trim();
        const isOrphanedContent = orphanedContentPattern.test(trimmedLine);
        
        if (inSolutionSection && isOrphanedContent) {
          // This is orphaned "New Card" content inside solution section - skip it
          skipOrphanedContent = true;
          continue;
        } else if (skipOrphanedContent) {
          // We're in a sequence of orphaned content - skip blank lines and more orphaned content
          if (trimmedLine === '' || isOrphanedContent) {
            continue;
          } else {
            // We've hit legitimate content - stop skipping
            skipOrphanedContent = false;
            cleanedLines.push(line);
          }
        } else {
          // Not orphaned content - check if the next lines might be orphaned
          // Look ahead to see if this blank line is followed by orphaned content
          if (inSolutionSection && trimmedLine === '' && i + 1 < lines.length) {
            const nextLine = lines[i + 1]?.trim() || '';
            if (orphanedContentPattern.test(nextLine)) {
              // This blank line is followed by orphaned content - skip it
              skipOrphanedContent = true;
              continue;
            }
          }
          cleanedLines.push(line);
        }
      }
    }
    
    // Use cleaned lines for the rest of the logic
    const cleanedContent = cleanedLines.join('\n');
    const cleanedLinesArray = cleanedContent.split('\n');
    
    // Debug: Log cleanup results
    const orphanedBefore = content.match(orphanedContentPattern)?.length || 0;
    const orphanedAfter = cleanedContent.match(orphanedContentPattern)?.length || 0;
    
    // Find all headers in cleaned content to see what was preserved
    const cleanedHeaders = cleanedLinesArray
      .map((line, i) => {
        const match = line.trim().match(/^#\s+(.+)$/);
        return match ? { line: i, title: match[1].trim() } : null;
      })
      .filter(Boolean);
    
    const allHeaderTitles = cleanedHeaders.map(h => h?.title).filter(Boolean);
    const hasNewCard1 = cleanedHeaders.some(h => h?.title?.toLowerCase().includes('new card 1'));
    const newCardHeaderTitles = cleanedHeaders.filter(h => h?.title?.toLowerCase().includes('new card')).map(h => h?.title);
    
    console.log('🧹 Cleanup:', { 
      orphanedBefore, 
      orphanedAfter, 
      linesRemoved: lines.length - cleanedLinesArray.length,
      totalHeaders: cleanedHeaders.length,
      allHeaders: allHeaderTitles,
      hasNewCard1,
      newCardHeaders: newCardHeaderTitles
    });
    
    // Re-check for existing cards in CLEANED content (in case cleanup preserved cards we missed)
    for (let i = 0; i < cleanedLinesArray.length; i++) {
      const line = cleanedLinesArray[i];
      const trimmed = line.trim();
      const match = trimmed.match(newCardPattern);
      if (match) {
        const cardNumber = parseInt(match[1], 10);
        if (!foundCards.includes(cardNumber)) {
          foundCards.push(cardNumber);
          console.log('🔍 Found additional card in cleaned content:', { line: i, cardNumber, lineText: trimmed });
        }
        if (cardNumber > maxCardNumber) {
          maxCardNumber = cardNumber;
        }
      }
    }
    
    console.log('🔢 Updated card count after cleanup:', { foundCards, maxCardNumber, nextCardNumber: maxCardNumber + 1 });
    
    // Recalculate solution section indices after cleanup
    foundSolutionSection = false;
    solutionSectionEndIndex = -1;
    solutionSectionStartIndex = -1;
    
    for (let i = 0; i < cleanedLinesArray.length; i++) {
      const line = cleanedLinesArray[i];
      const headerMatch = line.trim().match(/^#\s+(.+)$/);
      
      if (headerMatch) {
        const title = headerMatch[1].trim();
        const titleLower = title.toLowerCase();
        
        if (titleLower === 'the solution' || (titleLower.startsWith('the solution') && !titleLower.includes('cards') && !titleLower.includes('new card'))) {
          if (!foundSolutionSection) {
            foundSolutionSection = true;
            solutionSectionStartIndex = i;
          }
        } else if (foundSolutionSection && solutionSectionStartIndex >= 0) {
          solutionSectionEndIndex = i;
          break;
        }
      }
    }
    
    if (foundSolutionSection && solutionSectionEndIndex === -1) {
      solutionSectionEndIndex = cleanedLinesArray.length;
    }
    
    // Use maxCardNumber we already calculated from original content
    // No need to recount - we already know what cards exist

    // Create a new card section with default content
    const newCardNumber = maxCardNumber + 1;
    const newCardTitle = `New Card ${newCardNumber}`;
    const newCardContent = `Add content for ${newCardTitle} here.\n\nYou can use Markdown formatting:\n- Bullet points\n- **Bold text**\n- *Italic text*`;
    
    console.log('📝 Creating card:', { newCardTitle, newCardNumber });
    
    // Safety check: if this card number already exists, something went wrong
    if (foundCards.includes(newCardNumber)) {
      console.error('❌ ERROR: Card number already exists!', { newCardNumber, foundCards });
      // Still update content with cleaned version (removes orphaned content)
      onContentUpdate(cleanedContent);
      return;
    }
    
    // Find the last existing solution card (if any) to insert after it
    // Solution cards are sections that start with "New Card" or similar patterns
    let lastSolutionCardEndIndex = solutionSectionEndIndex;
    let needsSolutionSection = false;
    
    // If solution section doesn't exist, we need to create it
    // Find "Competitive analysis" or "Research insights" to insert "The solution" section after it
    if (!foundSolutionSection || solutionSectionEndIndex < 0) {
      needsSolutionSection = true;
      // Find "Competitive analysis" section or the last section
      for (let i = cleanedLinesArray.length - 1; i >= 0; i--) {
        const line = cleanedLinesArray[i];
        if (!line) continue;
        const headerMatch = line.trim().match(/^#\s+(.+)$/);
        if (headerMatch) {
          const title = headerMatch[1].trim().toLowerCase();
          // Find "Competitive analysis" or "Research insights" as insertion point for "The solution" section
          if (title === 'competitive analysis' || title === 'research insights') {
            // Find where this section ends (next header or end of file)
            lastSolutionCardEndIndex = i + 1;
            for (let j = i + 1; j < cleanedLinesArray.length; j++) {
              const nextLine = cleanedLinesArray[j];
              if (!nextLine) continue;
              if (nextLine.trim().match(/^#\s+/)) {
                lastSolutionCardEndIndex = j;
                break;
              }
              lastSolutionCardEndIndex = j + 1; // End of file
            }
            break;
          }
        }
      }
      // If still not found, insert at end of file
      if (lastSolutionCardEndIndex < 0) {
        lastSolutionCardEndIndex = cleanedLinesArray.length;
      }
    } else if (solutionSectionEndIndex >= 0) {
      // Solution section exists - find existing solution cards
      // First, find all solution card headers in cleaned content AFTER the solution section
      const solutionCardHeaders: Array<{ index: number; title: string }> = [];
      
      // If solutionSectionEndIndex equals array length, cards might be in original content but removed during cleanup
      // In that case, we need to find the last card in the ORIGINAL content and append after it
      if (solutionSectionEndIndex >= cleanedLinesArray.length && maxCardNumber > 0) {
        // Cards exist in original content but might have been removed during cleanup
        // Find the last card in ORIGINAL content (lines array) and insert after it
        console.log('🔍 Solution section at end, but cards exist in original content. Finding last card in original content.');
        
        // Search for solution cards in ORIGINAL content (lines array)
        // Start from solutionSectionStartIndex (where "The solution" starts) or solutionSectionEndIndex
        // If solutionSectionEndIndex === lines.length, search backwards from the end
        const originalSolutionCardHeaders: Array<{ index: number; title: string }> = [];
        const searchStartIndex = solutionSectionEndIndex < lines.length ? solutionSectionEndIndex : solutionSectionStartIndex;
        
        for (let i = searchStartIndex; i < lines.length; i++) {
          const line = lines[i];
          if (!line) continue;
          const headerMatch = line.trim().match(/^#\s+(.+)$/);
          if (headerMatch) {
            const title = headerMatch[1].trim();
            if (newCardPattern.test(line.trim())) {
              originalSolutionCardHeaders.push({ index: i, title });
              console.log('🔍 Found card in original content at index', i, ':', title);
            } else {
              // Found a non-solution-card section - stop searching
              break;
            }
          }
        }
        
        // Also search backwards from the end if we didn't find any cards
        if (originalSolutionCardHeaders.length === 0 && solutionSectionEndIndex >= lines.length) {
          console.log('🔍 Searching backwards from end of file for cards...');
          for (let i = lines.length - 1; i >= solutionSectionStartIndex; i--) {
            const line = lines[i];
            if (!line) continue;
            const headerMatch = line.trim().match(/^#\s+(.+)$/);
            if (headerMatch) {
              const title = headerMatch[1].trim();
              if (newCardPattern.test(line.trim())) {
                originalSolutionCardHeaders.push({ index: i, title });
                console.log('🔍 Found card in original content (backwards search) at index', i, ':', title);
                break; // Found the last card, stop searching
              } else if (title.toLowerCase().includes('solution')) {
                // We've reached "The solution" section, stop searching backwards
                break;
              }
            }
          }
        }
        
        if (originalSolutionCardHeaders.length > 0) {
          // Found cards in original content - find where the LAST one ends
          const lastCardHeader = originalSolutionCardHeaders[originalSolutionCardHeaders.length - 1];
          let originalCardEndIndex = lastCardHeader.index + 1;
          
          // Find where this card ends (next header or end of file) in ORIGINAL content
          for (let j = lastCardHeader.index + 1; j < lines.length; j++) {
            const nextLine = lines[j];
            if (!nextLine) continue;
            if (nextLine.trim().match(/^#\s+/)) {
              originalCardEndIndex = j;
              break;
            }
            originalCardEndIndex = j + 1;
          }
          
          // Now we need to insert the new card content at the end of cleaned content
          // The cleaned content doesn't have "New Card 9", so we append at the end
          // This will add "New Card 10" after whatever is in the cleaned content
          lastSolutionCardEndIndex = cleanedLinesArray.length;
          console.log('🔍 Last card in original content ends at:', {
            lastCardTitle: lastCardHeader.title,
            originalCardEndIndex,
            cleanedContentLength: cleanedLinesArray.length,
            action: 'Appending new card at end of cleaned content'
          });
        } else {
          // No cards found even in original - append at end
          lastSolutionCardEndIndex = cleanedLinesArray.length;
          console.log('🔍 No cards found in original content either - appending at end');
        }
      } else if (solutionSectionEndIndex < cleanedLinesArray.length) {
        // Search for cards in cleaned content
        console.log('🔍 Searching for solution cards:', {
          solutionSectionEndIndex,
          cleanedLinesLength: cleanedLinesArray.length,
          previewAtSolutionEnd: cleanedLinesArray.slice(Math.max(0, solutionSectionEndIndex - 2), Math.min(cleanedLinesArray.length, solutionSectionEndIndex + 5)),
          lineAtSolutionEnd: cleanedLinesArray[solutionSectionEndIndex]?.substring(0, 100)
        });
        
        for (let i = solutionSectionEndIndex; i < cleanedLinesArray.length; i++) {
          const line = cleanedLinesArray[i];
          if (!line) continue;
          const headerMatch = line.trim().match(/^#\s+(.+)$/);
          if (headerMatch) {
            const title = headerMatch[1].trim();
            const isNewCard = newCardPattern.test(line.trim());
            console.log('🔍 Checking line', i, ':', title, '| isNewCard:', isNewCard);
            if (isNewCard) {
              solutionCardHeaders.push({ index: i, title });
            } else {
              // Found a non-solution-card section - stop searching
              console.log('🔍 Stopping search - found non-solution-card section:', title);
              break;
            }
          }
        }
        
        console.log('🔍 Found solution card headers:', solutionCardHeaders);
        
        if (solutionCardHeaders.length > 0) {
          // Found solution cards - find where the LAST one ends
          const lastCardHeader = solutionCardHeaders[solutionCardHeaders.length - 1];
          let cardEndIndex = lastCardHeader.index + 1;
          
          // Find where this card ends (next header or end of file)
          for (let j = lastCardHeader.index + 1; j < cleanedLinesArray.length; j++) {
            const nextLine = cleanedLinesArray[j];
            if (!nextLine) continue;
            if (nextLine.trim().match(/^#\s+/)) {
              // Found next section header - this is the end of the last card
              cardEndIndex = j;
              break;
            }
            cardEndIndex = j + 1; // End of file
          }
          
          lastSolutionCardEndIndex = cardEndIndex;
          console.log('🔍 Last solution card ends at:', {
            lastCardTitle: lastCardHeader.title,
            lastCardStartIndex: lastCardHeader.index,
            lastCardEndIndex: cardEndIndex,
            nextLinePreview: cleanedLinesArray[cardEndIndex]?.substring(0, 50)
          });
        } else {
          // No solution cards found in cleaned content - check if there's a card at solutionSectionEndIndex
          // that wasn't matched by the pattern
          const lineAtEnd = cleanedLinesArray[solutionSectionEndIndex];
          if (lineAtEnd) {
            const trimmed = lineAtEnd.trim();
            const headerMatch = trimmed.match(/^#\s+(.+)$/);
            if (headerMatch) {
              const title = headerMatch[1].trim();
              // Check if this looks like a solution card (even if pattern didn't match)
              if (title.toLowerCase().includes('new card')) {
                // This IS a solution card - find where it ends
                console.log('🔍 Found solution card at solutionSectionEndIndex that pattern missed:', title);
                let cardEndIndex = solutionSectionEndIndex + 1;
                for (let j = solutionSectionEndIndex + 1; j < cleanedLinesArray.length; j++) {
                  const nextLine = cleanedLinesArray[j];
                  if (!nextLine) continue;
                  if (nextLine.trim().match(/^#\s+/)) {
                    cardEndIndex = j;
                    break;
                  }
                  cardEndIndex = j + 1;
                }
                lastSolutionCardEndIndex = cardEndIndex;
                console.log('🔍 Found solution card ends at:', cardEndIndex);
              } else {
                // Not a solution card, but cards exist in original - append at end
                if (maxCardNumber > 0) {
                  console.log('🔍 Cards exist in original but not in cleaned - appending at end');
                  lastSolutionCardEndIndex = cleanedLinesArray.length;
                } else {
                  lastSolutionCardEndIndex = solutionSectionEndIndex;
                  console.log('🔍 No solution cards found, inserting before next section at:', solutionSectionEndIndex);
                }
              }
            } else {
              // Not a header - if cards exist in original, append at end
              if (maxCardNumber > 0) {
                console.log('🔍 Cards exist in original but not in cleaned - appending at end');
                lastSolutionCardEndIndex = cleanedLinesArray.length;
              } else {
                lastSolutionCardEndIndex = solutionSectionEndIndex;
                console.log('🔍 No solution cards found, inserting at solution section end:', solutionSectionEndIndex);
              }
            }
          } else {
            // No line at end - if cards exist in original, append at end
            if (maxCardNumber > 0) {
              console.log('🔍 Cards exist in original but not in cleaned - appending at end');
              lastSolutionCardEndIndex = cleanedLinesArray.length;
            } else {
              lastSolutionCardEndIndex = solutionSectionEndIndex;
              console.log('🔍 No solution cards found, inserting at solution section end:', solutionSectionEndIndex);
            }
          }
        }
      } else {
        // solutionSectionEndIndex >= cleanedLinesArray.length and no cards in original
        lastSolutionCardEndIndex = cleanedLinesArray.length;
        console.log('🔍 Solution section at end, no cards - inserting at end of file:', lastSolutionCardEndIndex);
      }
    }
    
    // Log all headers found in cleaned content for debugging
    const allHeadersInCleaned = cleanedLinesArray
      .map((line, idx) => {
        const match = line.trim().match(/^#\s+(.+)$/);
        return match ? { index: idx, title: match[1].trim() } : null;
      })
      .filter(Boolean);
    
    console.log('📍 Insertion calculation:', {
      solutionSectionEndIndex,
      lastSolutionCardEndIndex,
      newCardTitle,
      newCardNumber,
      cleanedLinesLength: cleanedLinesArray.length,
      previewBeforeInsertion: cleanedLinesArray.slice(Math.max(0, lastSolutionCardEndIndex - 5), lastSolutionCardEndIndex),
      previewAfterInsertion: cleanedLinesArray.slice(lastSolutionCardEndIndex, Math.min(cleanedLinesArray.length, lastSolutionCardEndIndex + 5)),
      lineAtInsertionPoint: cleanedLinesArray[lastSolutionCardEndIndex]?.substring(0, 100),
      allHeadersInCleanedContent: allHeadersInCleaned,
      headersAfterSolution: allHeadersInCleaned.filter(h => h && h.index >= solutionSectionEndIndex)
    });
    
    // Before insertion, restore any missing cards from original content
    // If cards exist in original but not in cleaned, we need to restore them
    if (solutionSectionEndIndex >= 0 && solutionSectionEndIndex >= cleanedLinesArray.length && maxCardNumber > 0) {
      // Cards exist in original content but are missing from cleaned content
      // Find all solution cards in original content and restore them to cleaned content
      const missingCards: Array<{ startIndex: number; endIndex: number; lines: string[] }> = [];
      
      // Find solution cards in original content
      // Start from solutionSectionStartIndex (where "The solution" starts) or solutionSectionEndIndex
      // If solutionSectionEndIndex === lines.length, search from solutionSectionStartIndex
      const searchStartIndex = solutionSectionEndIndex < lines.length ? solutionSectionEndIndex : solutionSectionStartIndex;
      
      for (let i = searchStartIndex; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const headerMatch = line.trim().match(/^#\s+(.+)$/);
        if (headerMatch) {
          const title = headerMatch[1].trim();
          if (newCardPattern.test(line.trim())) {
            // Found a solution card - extract its full content
            const cardStartIndex = i;
            let cardEndIndex = i + 1;
            
            // Find where this card ends (next header or end of file)
            for (let j = i + 1; j < lines.length; j++) {
              const nextLine = lines[j];
              if (!nextLine) continue;
              if (nextLine.trim().match(/^#\s+/)) {
                cardEndIndex = j;
                break;
              }
              cardEndIndex = j + 1;
            }
            
            // Extract the card content (including the header)
            const cardLines = lines.slice(cardStartIndex, cardEndIndex);
            missingCards.push({ startIndex: cardStartIndex, endIndex: cardEndIndex, lines: cardLines });
            console.log('🔧 Found missing card to restore:', title, 'at index', cardStartIndex);
            
            // Move to next iteration (will skip to next header)
            i = cardEndIndex - 1;
          } else {
            // Found a non-solution-card section - stop searching
            break;
          }
        }
      }
      
      // If we didn't find any cards and solutionSectionEndIndex === lines.length, search backwards to find ALL cards
      if (missingCards.length === 0 && solutionSectionEndIndex >= lines.length) {
        console.log('🔧 Searching backwards from end of file for cards to restore...');
        const backwardsCards: Array<{ startIndex: number; endIndex: number; lines: string[] }> = [];
        for (let i = lines.length - 1; i >= solutionSectionStartIndex; i--) {
          const line = lines[i];
          if (!line) continue;
          const headerMatch = line.trim().match(/^#\s+(.+)$/);
          if (headerMatch) {
            const title = headerMatch[1].trim();
            if (newCardPattern.test(line.trim())) {
              // Found a solution card - extract its full content
              const cardStartIndex = i;
              let cardEndIndex = i + 1;
              
              // Find where this card ends (next header or end of file)
              for (let j = i + 1; j < lines.length; j++) {
                const nextLine = lines[j];
                if (!nextLine) continue;
                if (nextLine.trim().match(/^#\s+/)) {
                  cardEndIndex = j;
                  break;
                }
                cardEndIndex = j + 1;
              }
              
              // Extract the card content (including the header)
              const cardLines = lines.slice(cardStartIndex, cardEndIndex);
              backwardsCards.unshift({ startIndex: cardStartIndex, endIndex: cardEndIndex, lines: cardLines }); // unshift to maintain order
              console.log('🔧 Found missing card to restore (backwards search):', title, 'at index', cardStartIndex);
            } else if (title.toLowerCase().includes('solution') && !title.toLowerCase().includes('new card')) {
              // We've reached "The solution" section, stop searching backwards
              break;
            }
          }
        }
        // Add backwards cards to missingCards (they're already in correct order)
        missingCards.push(...backwardsCards);
      }
      
      // Restore missing cards to cleaned content
      if (missingCards.length > 0) {
        console.log('🔧 Restoring missing cards from original content:', missingCards.map(c => c.lines[0]?.trim()));
        
        // Find where "The solution" section ends in cleaned content
        let solutionEndInCleaned = -1;
        for (let i = 0; i < cleanedLinesArray.length; i++) {
          const line = cleanedLinesArray[i];
          const headerMatch = line.trim().match(/^#\s+(.+)$/);
          if (headerMatch) {
            const title = headerMatch[1].trim().toLowerCase();
            if (title === 'the solution' || (title.startsWith('the solution') && !title.includes('cards') && !title.includes('new card'))) {
              // Find where this section ends
              for (let j = i + 1; j < cleanedLinesArray.length; j++) {
                const nextLine = cleanedLinesArray[j];
                if (!nextLine) continue;
                if (nextLine.trim().match(/^#\s+/)) {
                  solutionEndInCleaned = j;
                  break;
                }
                solutionEndInCleaned = j + 1;
              }
              if (solutionEndInCleaned === -1) {
                solutionEndInCleaned = cleanedLinesArray.length;
              }
              break;
            }
          }
        }
        
        // If solution section ends at the end of cleaned content, append missing cards
        if (solutionEndInCleaned >= 0 && solutionEndInCleaned >= cleanedLinesArray.length - 1) {
          // Append missing cards to cleaned content
          missingCards.forEach(card => {
            cleanedLinesArray.push('');
            card.lines.forEach(line => {
              cleanedLinesArray.push(line);
            });
          });
          console.log('✅ Restored missing cards to cleaned content. New length:', cleanedLinesArray.length);
          
          // Update lastSolutionCardEndIndex to point after the last restored card
          lastSolutionCardEndIndex = cleanedLinesArray.length;
        }
      }
    }
    
    // Second pass: build the new content with the card inserted
    // CRITICAL: Use ORIGINAL lines array (from latestProjectContent) as base, not cleanedLinesArray
    // cleanedLinesArray may be missing cards that were in latestProjectContent
    
    // Find where to insert the new card in the ORIGINAL lines array
    // If we found cards, insert after the last one. Otherwise, insert after solution section.
    let actualCardInsertionPoint = lines.length; // Default: end of file
    if (!needsSolutionSection && maxCardNumber > 0) {
      // Find the last "New Card" section in original lines and insert after it
      let lastCardEndIndex = -1;
      for (let i = solutionSectionStartIndex >= 0 ? solutionSectionStartIndex : 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const headerMatch = line.trim().match(/^#\s+(.+)$/);
        if (headerMatch) {
          const title = headerMatch[1].trim();
          if (newCardPattern.test(line.trim())) {
            // Found a card - find where it ends
            let cardEndIndex = i + 1;
            for (let j = i + 1; j < lines.length; j++) {
              const nextLine = lines[j];
              if (!nextLine) continue;
              if (nextLine.trim().match(/^#\s+/)) {
                cardEndIndex = j;
                break;
              }
              cardEndIndex = j + 1;
            }
            lastCardEndIndex = cardEndIndex; // Update to the last card found
          } else if (title.toLowerCase().includes('solution') && !title.toLowerCase().includes('new card')) {
            // Still in solution section, keep searching
            continue;
          } else {
            // Found a non-card, non-solution section - stop searching
            if (lastCardEndIndex >= 0) {
              break; // Use the last card we found
            }
          }
        }
      }
      if (lastCardEndIndex >= 0) {
        actualCardInsertionPoint = lastCardEndIndex;
        console.log('📍 Found last card in original lines, inserting new card at:', actualCardInsertionPoint);
      } else if (solutionSectionEndIndex >= 0 && solutionSectionEndIndex < lines.length) {
        actualCardInsertionPoint = solutionSectionEndIndex;
        console.log('📍 No cards found, inserting after solution section at:', actualCardInsertionPoint);
      }
    } else if (!needsSolutionSection && solutionSectionEndIndex >= 0 && solutionSectionEndIndex < lines.length) {
      actualCardInsertionPoint = solutionSectionEndIndex;
    }
    
    const solutionSectionInsertionPoint = needsSolutionSection ? actualCardInsertionPoint : -1;
    const cardInsertionPoint = needsSolutionSection ? -1 : actualCardInsertionPoint;
    
    // Build new content from ORIGINAL lines array (which has all cards from latestProjectContent)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if we should insert "The solution" section BEFORE this line
      // If we're creating the solution section, also insert the card immediately after it
      if (needsSolutionSection && !cardInserted && i === solutionSectionInsertionPoint) {
        // Insert "The solution" section
        if (newLines.length > 0 && newLines[newLines.length - 1].trim() !== '') {
          newLines.push('');
        }
        newLines.push('');
        newLines.push('# The solution: A new direction');
        newLines.push('');
        newLines.push('Armed with these insights, we rallied around a new vision: to become the go-to cannabis discovery engine. This meant a complete overhaul of the app\'s core functionality.');
        newLines.push('');
        console.log('✅ Created "The solution" section at line', i);
        
        // Immediately insert the card after the solution section
        newLines.push('');
        newLines.push('');
        const cardHeader = `# ${newCardTitle}`;
        console.log('📝 About to insert card header:', cardHeader, '| newCardTitle:', newCardTitle, '| newCardNumber:', newCardNumber);
        newLines.push(cardHeader);
        const contentLines = newCardContent.split('\n');
        contentLines.forEach(contentLine => {
          newLines.push(contentLine);
        });
        cardInserted = true;
        console.log('📌 Inserted card immediately after solution section at line', i, '| Card header:', cardHeader);
      }
      // Check if we should insert the card BEFORE this line (when solution section already exists)
      else if (!needsSolutionSection && !cardInserted && i === cardInsertionPoint) {
        // Insert the new card BEFORE this line (which is the next section or end of file)
        // Ensure we have proper spacing
        if (newLines.length > 0 && newLines[newLines.length - 1].trim() !== '') {
          newLines.push(''); // Add blank line separator
        }
        newLines.push(''); // Add second blank line
        // CRITICAL: Add the new card header FIRST - this creates a new markdown section
        const cardHeader = `# ${newCardTitle}`;
        console.log('📝 About to insert card header:', cardHeader, '| newCardTitle:', newCardTitle, '| newCardNumber:', newCardNumber);
        newLines.push(cardHeader);
        // Add the new card content lines AFTER the header
        const contentLines = newCardContent.split('\n');
        contentLines.forEach(contentLine => {
          newLines.push(contentLine);
        });
        cardInserted = true;
        console.log('📌 Inserted card at line', i, '| Insertion point:', cardInsertionPoint, '| Solution section ends at:', solutionSectionEndIndex, '| Card header:', cardHeader);
      }
      
      // Add the current line
      newLines.push(line);
    }
    
    // If we need to insert solution section at end of file
    if (needsSolutionSection && solutionSectionInsertionPoint >= lines.length && !cardInserted) {
      if (newLines.length > 0 && newLines[newLines.length - 1].trim() !== '') {
        newLines.push('');
      }
      newLines.push('');
      newLines.push('# The solution: A new direction');
      newLines.push('');
      newLines.push('Armed with these insights, we rallied around a new vision: to become the go-to cannabis discovery engine. This meant a complete overhaul of the app\'s core functionality.');
      newLines.push('');
      console.log('✅ Created "The solution" section at end of file');
      
      // Immediately insert the card after the solution section
      newLines.push('');
      newLines.push('');
      newLines.push(`# ${newCardTitle}`);
      const contentLines = newCardContent.split('\n');
      contentLines.forEach(contentLine => {
        newLines.push(contentLine);
      });
      cardInserted = true;
      console.log('✅ Card inserted immediately after solution section at end of file:', newCardTitle);
    }
    // If we haven't inserted the card yet and insertion point is at end of file (solution section already exists)
    else if (!needsSolutionSection && !cardInserted && cardInsertionPoint >= lines.length) {
      // Insert at the end
      if (newLines.length > 0 && newLines[newLines.length - 1].trim() !== '') {
        newLines.push('');
      }
      newLines.push('');
      newLines.push(`# ${newCardTitle}`);
      const contentLines = newCardContent.split('\n');
      contentLines.forEach(contentLine => {
        newLines.push(contentLine);
      });
      cardInserted = true;
      console.log('✅ Card inserted at end of file:', newCardTitle);
    }
    
    // Final fallback: If we still haven't inserted (shouldn't happen, but safety check)
    if (!cardInserted) {
      // Ensure we have proper spacing
      if (newLines.length > 0 && newLines[newLines.length - 1].trim() !== '') {
        newLines.push(''); // Add blank line separator
      }
      newLines.push(''); // Add second blank line
      // Add the new card header FIRST
      newLines.push(`# ${newCardTitle}`);
      // Add the new card content lines AFTER the header
      const contentLines = newCardContent.split('\n');
      contentLines.forEach(contentLine => {
        newLines.push(contentLine);
      });
      console.log('⚠️ Fallback: Card inserted at end (should not happen)', newCardTitle);
    }
    
    const newContent = newLines.join('\n');
    console.log('✅ Adding new card after solution section:', newCardTitle);
    console.log('📝 Solution section ends at line:', solutionSectionEndIndex, '| Total lines:', cleanedLinesArray.length);
    console.log('📝 Card inserted:', cardInserted);
    console.log('📝 newCardTitle:', newCardTitle, '| newCardNumber:', newCardNumber);
    // Log a preview of the content around the insertion point
    const previewStart = Math.max(0, Math.min(solutionSectionEndIndex - 2, cleanedLinesArray.length));
    const previewEnd = Math.min(cleanedLinesArray.length, solutionSectionEndIndex + 5);
    console.log('📝 Content preview around insertion:', cleanedLinesArray.slice(previewStart, previewEnd).join('\n'));
    
    // Verify the new content contains the correct card header
    const hasCorrectCardHeader = newContent.includes(`# ${newCardTitle}`);
    const hasWrongHeader = newContent.match(/# The solution: A new direction/g)?.length || 0;
    console.log('🔍 Content verification:', { 
      hasCorrectCardHeader, 
      hasWrongHeader, 
      duplicateSolutionHeaders: hasWrongHeader > 1,
      newContentPreview: newContent.split('\n').slice(Math.max(0, newContent.split('\n').length - 20)).join('\n')
    });
    
    if (!hasCorrectCardHeader) {
      console.error('❌ ERROR: New content does not contain the correct card header!', { newCardTitle, newContentPreview: newContent.slice(0, 500) });
    }
    
    if (hasWrongHeader > 1) {
      console.warn('⚠️ WARNING: Content has duplicate solution headers!', { count: hasWrongHeader });
    }
    
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

    // CRITICAL: Use latestProjectContent as the base, not content
    // content is cleaned/filtered and may be missing cards, but latestProjectContent has all saved cards
    const contentToEdit = latestProjectContent || content;
    console.log('🗑️ Removing card:', sectionTitle, '| Using:', latestProjectContent ? 'latestProjectContent (has all cards)' : 'content (may be missing cards)');

    // Remove the section from the content
    const lines = contentToEdit.split('\n');
    const newLines: string[] = [];
    let inTargetSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is the start of our target section
      const headerMatch = line.match(/^# (.+)$/);
      if (headerMatch && headerMatch[1].trim() === sectionTitle) {
        inTargetSection = true;
        console.log('🗑️ Found target section header at line', i, ':', sectionTitle);
        continue; // Skip the header line - don't add it to newLines
      }

      // Check if we've hit another top-level section
      if (inTargetSection && headerMatch) {
        // Found next section header - stop skipping
        inTargetSection = false;
        console.log('🗑️ Found next section header at line', i, '- stopping deletion, adding this header');
        // Add this new header (it's the start of the next section)
        newLines.push(line);
        continue;
      }

      // Only keep lines that are not in the target section
      if (!inTargetSection) {
        newLines.push(line);
      } else {
        // We're skipping this line because it's part of the target section
        // This includes both the header (already skipped above) and all content lines
      }
    }
    
    // If we were still in the target section at the end, that's fine - it means it was the last section
    if (inTargetSection) {
      console.log('🗑️ Deleted section was the last section in the file');
    }

    const newContent = newLines.join('\n');
    
    // Verify the deletion
    const remainingHeaders = newContent.split('\n').filter(l => l.trim().match(/^# (.+)$/)).map(l => l.trim());
    const deletedHeaderExists = remainingHeaders.some(h => h.includes(sectionTitle));
    console.log('🗑️ Deletion complete:', {
      originalLines: lines.length,
      newLines: newLines.length,
      deletedHeaderExists,
      remainingCardHeaders: remainingHeaders.filter(h => !h.includes('The solution') && !h.includes('Overview') && !h.includes('Research insights') && !h.includes('Competitive analysis') && !h.includes('The challenge') && !h.includes('My role'))
    });
    
    if (deletedHeaderExists) {
      console.warn('⚠️ WARNING: Deleted header still exists in content!');
    }
    
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
  // Use latestProjectContent if available (for accurate solution cards parsing), otherwise fall back to content
  const parseSections = () => {
    const contentToParse = latestProjectContent || content;
    const lines = contentToParse.split('\n');
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
-      // Check for h2 header (## Name)
-      if (line.trim().match(/^## (.+)$/)) {
+      // Check for h2/h3 header (## Name or ### Name)
+      const headingMatch = line.trim().match(/^##+\s+(.+)$/);
+      if (headingMatch) {
         // Save previous item if exists
         if (currentItem) {
           items.push(currentItem);
         }
         // Start new item
-        const name = (line || '').trim().substring(3).trim();
-        currentItem = { name, content: '' };
+        const name = headingMatch[1].trim();
+        currentItem = { name, content: '' };
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

  const isKeyFeaturesSection = (section: { title: string; content: string }) => {
    if (!section?.title) return false;

    const titleLower = section.title.toLowerCase();

    // Never treat solution sections as key features, even if they contain subsections
    if (titleLower.includes('solution')) {
      return false;
    }

    const titleKeywords = [
      'key feature',
      'project phase',
      'project phases',
      'project milestone',
      'milestone',
      'pillar',
      'highlight',
      'capability'
    ];

    if (titleKeywords.some(keyword => titleLower.includes(keyword))) {
      return true;
    }

    const features = parseSubsections(section.content || '');
    if (features.length < 2) {
      return false;
    }

    const headingKeywords = ['feature', 'phase', 'pillar', 'milestone', 'highlight', 'capability', 'stage', 'step'];
    const headingsLower = features.map(item => (item.name || '').toLowerCase());
    const hasFeatureKeyword = headingsLower.some(name => headingKeywords.some(keyword => name.includes(keyword)));
    const distinctHeadingCount = new Set(headingsLower).size;

    if (hasFeatureKeyword && distinctHeadingCount >= 2) {
      return true;
    }

    const averageHeadingLength = headingsLower.reduce((acc, name) => acc + name.length, 0) / features.length;
    const maxContentLength = Math.max(...features.map(item => (item.content || '').trim().length));

    return distinctHeadingCount >= 2 && averageHeadingLength <= 40 && maxContentLength <= 1200;
  };

  const sections = parseSections();

  console.log('📋 Parsed sections:', {
    totalSections: sections.length,
    sectionTitles: sections.map(s => s.title),
    hasNewCard3: sections.some(s => s.title.includes('New Card 3')),
    hasNewCard4: sections.some(s => s.title.includes('New Card 4')),
    usingLatestProjectContent: !!latestProjectContent,
    contentLength: content.length,
    latestProjectContentLength: latestProjectContent?.length || 0,
    contentPreview: (latestProjectContent || content).substring(0, 200)
  });

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
    "My role & impact", // Explicitly include full title
    "Research insights",
    "Competitive analysis",
    "Solution highlights",
    "Key contributions",
    "The solution", // Include "The solution" to match "The solution: A new direction"
    "The solution: A new direction" // Explicitly include this title
  ];
  
  // Split into sections before and after "The Solution"
  // Include "Key features" explicitly (it has special rendering, not decorative card style)
  // Include ALL sections in beforeSolution - they should all be renderable and moveable
  const beforeSolution = regularSections.filter(s => {
    const titleLower = s.title.toLowerCase();
    // Check if it matches decorative sections (bidirectional matching for "My role" vs "My role & impact")
    const isDecorative = decorativeCardSections.some(dec => {
      const decLower = dec.toLowerCase();
      return titleLower.includes(decLower) || decLower.includes(titleLower);
    });
    const isSolution = titleLower.includes("solution") && !titleLower.includes("cards");
    const isKeyFeatures = isKeyFeaturesSection(s);
    // Include decorative sections, solution sections, AND Key features
    return isDecorative || isSolution || isKeyFeatures;
  });
  
  const afterSolutionRaw = regularSections.filter((s, index) => {
    // Only include sections that come AFTER the solution section
    if (solutionIndex === -1 || index <= solutionIndex) {
      return false;
    }
    
    const titleLower = s.title.toLowerCase();
    const isDecorative = decorativeCardSections.some(dec => {
      const decLower = dec.toLowerCase();
      return titleLower.includes(decLower) || decLower.includes(titleLower);
    });
    // Exclude any section with "solution" in the title (but not "Solution cards" which is the grid itself)
    const isSolution = titleLower.includes("solution") && !titleLower.includes("cards");
    const isKeyFeatures = isKeyFeaturesSection(s);
    const isResearchInsights = titleLower.includes("research insights") || titleLower.includes("research");
    
    // Debug logging
    if (isDecorative || isSolution || isKeyFeatures || isResearchInsights) {
      console.log('🚫 Excluding from solution cards grid:', s.title, {
        isDecorative,
        isSolution,
        isKeyFeatures,
        isResearchInsights
      });
    }
    
    // Exclude decorative sections, solution sections, research insights, AND Key features (it has special rendering)
    return !isDecorative && !isSolution && !isKeyFeatures && !isResearchInsights;
  });
  
  // Filter out specific sections we don't want in the grid
  // "Key features" is already excluded above, but add it here too for safety
  // Also exclude "Research insights" and "The solution" sections as they should be decorative cards, not solution cards
  const excludedSections = [
    "Key takeaway",
    "Design team",
    "Business and consumer impact",
    "Key features",
    "Project phases", // Also exclude when Key features is renamed
    "Research insights",
    "Research", // Also exclude when Research insights is renamed
    "The solution"
  ];
  const afterSolution = afterSolutionRaw.filter(section => {
    const titleLower = section.title.toLowerCase();
    return !excludedSections.some(excluded => {
      const excludedLower = excluded.toLowerCase();
      return titleLower.includes(excludedLower) || excludedLower.includes(titleLower);
    });
  });
  
  console.log('🔍 Solution Cards Filtering:', {
    solutionIndex,
    totalSections: regularSections.length,
    afterSolutionRawCount: afterSolutionRaw.length,
    afterSolutionCount: afterSolution.length,
    afterSolutionRawTitles: afterSolutionRaw.map(s => s.title),
    afterSolutionTitles: afterSolution.map(s => s.title),
    allRegularSectionTitles: regularSections.map(s => s.title)
  });
  
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
  if ((afterSolution.length > 0 || isEditMode) && solutionCardsPosition != null) {
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
                      disabled={(() => {
                        if (!actualPositions || actualPositions.total === 0) return false;
                        if (actualPositions.solutionCards === -1) return false; // Not found, allow movement
                        // Allow movement if there's at least one section after it
                        // Only disable if it's truly at the absolute last position with no way to move
                        return actualPositions.solutionCards >= actualPositions.total;
                      })()}
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
                {afterSolution.length > 0 ? afterSolution.map((cardSection, gridIndex) => {
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
                }) : (
                  // Empty state - show message in edit mode
                  isEditMode && (
                    <div className="col-span-full text-center py-8 text-muted-foreground border border-dashed border-border/30 rounded-2xl">
                      <p className="text-sm">No solution cards yet. Click "Add New Card" above to create one.</p>
                    </div>
                  )
                )}
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

        // Special handling for Research Insights section (flexible title matching)
        const isResearchSection = section.title.toLowerCase().includes("research") && 
                                  (section.title.toLowerCase().includes("insights") || 
                                   section.title.toLowerCase() === "research");
        if (isResearchSection) {
          console.log('🔍 Research section detected:', {
            title: section.title,
            contentLength: section.content?.length || 0,
            contentPreview: section.content?.substring(0, 300)
          });
          
          // Parse insights from ## subsections (same as competitive analysis)
          const parsedInsights = parseSubsections(section.content);
          console.log('🔍 Parsed insights:', {
            count: parsedInsights.length,
            insights: parsedInsights.map(i => ({
              name: i.name,
              contentLength: i.content?.length || 0,
              contentPreview: i.content?.substring(0, 100)
            }))
          });
          
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
                  <div className="flex gap-2 items-center">
                    {/* Grid Columns Control */}
                    {onResearchInsightsColumnsChange && (
                      <div className="flex items-center gap-2 mr-2">
                        <span className="text-xs text-muted-foreground">Grid:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3].map((cols) => (
                            <Button
                              key={cols}
                              size="sm"
                              variant={researchInsightsColumns === cols ? "default" : "outline"}
                              onClick={() => onResearchInsightsColumnsChange(cols as 1 | 2 | 3)}
                              className="h-8 w-8 p-0"
                              title={`${cols}x${cols} grid`}
                            >
                              {cols}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Section Title</label>
                    <Input
                      value={editedSectionTitle}
                      onChange={(e) => setEditedSectionTitle(e.target.value)}
                      placeholder="Enter section title"
                      className="font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Content (Markdown)</label>
                    <Textarea
                      value={editedSectionContent}
                      onChange={(e) => setEditedSectionContent(e.target.value)}
                      className="min-h-[400px] font-mono text-sm"
                      placeholder={'Enter research insights in Markdown format...\\n\\nExample:\\n## User needs\\nDescription of user needs\\n\\n## Pain points\\nDescription of pain points'}
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
                /* Insights Cards Grid */
                <div className={`grid gap-6 ${
                  researchInsightsColumns === 1 ? 'grid-cols-1' :
                  researchInsightsColumns === 2 ? 'grid-cols-1 md:grid-cols-2' :
                  'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }`}>
                  {insights.map((insight, insightIndex) => {
                  const insightKey = 7000 + insightIndex; // Unique key for each insight
                  const isExpanded = expandedCards.has(insightKey);
                  
                  const fullContent = insight.description.trim();
                  const contentLines = fullContent.split('\n').filter(line => line.trim());
                  const activeColumns = (researchInsightsColumns ?? 3) as 1 | 2 | 3;
                  const charThresholdMap: Record<1 | 2 | 3, number> = { 1: 700, 2: 540, 3: 360 };
                  const collapsedHeightMap: Record<1 | 2 | 3, number> = { 1: 360, 2: 280, 3: 220 };
                  const charThreshold = charThresholdMap[activeColumns];
                  const collapsedHeight = collapsedHeightMap[activeColumns];
                  
                  const hasMore = contentLines.length > 3 || fullContent.length > charThreshold;
                  const showGradient = hasMore && !isExpanded;
                  
                  console.log('🔍 Research insight card:', {
                    index: insightIndex,
                    title: insight.title,
                    contentLines: contentLines.length,
                    fullLength: fullContent.length,
                    hasMore,
                    isExpanded,
                    charThreshold,
                    collapsedHeight,
                    previewSample: fullContent.substring(0, 160)
                  });
                  
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
                          <>
                            <div className="relative text-muted-foreground leading-relaxed text-sm">
                              <motion.div
                                initial={false}
                                animate={{
                                  height: hasMore && !isExpanded ? `${collapsedHeight}px` : "auto",
                                  opacity: 1,
                                  marginTop: 0
                                }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden transition-all duration-300"
                                style={{ maxHeight: hasMore && !isExpanded ? `${collapsedHeight}px` : undefined }}
                              >
                                <MarkdownRenderer content={fullContent} variant="compact" />
                              </motion.div>
                              {showGradient && (
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent via-white/0 to-white/90 dark:via-slate-900/20 dark:to-slate-950/85" />
                              )}
                            </div>
                            
                            {hasMore && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCard(insightKey);
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
                                    backgroundImage: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
                                    backgroundClip: "text",
                                    WebkitBackgroundClip: "text",
                                    color: "transparent",
                                  }}
                                >
                                  {isExpanded ? "Show less" : "Show more"}
                                </motion.span>
                                <motion.span
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                  className="w-4 h-4 text-primary"
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </motion.span>
                              </button>
                            )}
                          </>
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

        // Special handling for Key Features section (flexible title matching)
        const keyFeaturesBlock = isKeyFeaturesSection(section);
        if (keyFeaturesBlock) {
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Section Title</label>
                    <Input
                      value={editedSectionTitle}
                      onChange={(e) => setEditedSectionTitle(e.target.value)}
                      placeholder="Enter section title"
                      className="font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Content (Markdown)</label>
                    <Textarea
                      value={editedSectionContent}
                      onChange={(e) => setEditedSectionContent(e.target.value)}
                      className="min-h-[400px] font-mono text-sm"
                      placeholder={'Enter key features in Markdown format...\\n\\nExample:\\n## Feature name\\nDescription of this key feature\\n\\n## Another feature\\nDescription'}
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
                /* Feature Cards with configurable columns (2x2 or 3x3) */
                <div className={`grid grid-cols-1 gap-6 ${keyFeaturesColumns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                  {featureCards.map((feature, idx) => {
                    const featureKey = 6000 + idx; // Unique key for each feature
                    const isExpanded = expandedCards.has(featureKey);
                    
                    // Get first 2 lines as preview
                    const contentLines = feature.description.trim().split('\n').filter(line => line.trim());
                    const previewLines = contentLines.slice(0, 2);
                    const previewContent = previewLines.join('\n');
                    const hasMore = contentLines.length > 2;
                    
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
                          {feature.description && (
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
                                    <MarkdownRenderer content={contentLines.slice(2).join('\n')} variant="compact" />
                                  </div>
                                </motion.div>
                              )}
                              
                              {/* View more button */}
                              {hasMore && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCard(featureKey);
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
                                    <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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
              )}
            </motion.div>
          );
        }

        // Special handling for Competitive Analysis section (flexible title matching)
        const isCompetitiveSection = section.title.toLowerCase().includes("competitive") || 
                                     section.title.toLowerCase().includes("competitor");
        if (isCompetitiveSection) {
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Section Title</label>
                    <Input
                      value={editedSectionTitle}
                      onChange={(e) => setEditedSectionTitle(e.target.value)}
                      placeholder="Enter section title"
                      className="font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Content (Markdown)</label>
                    <Textarea
                      value={editedSectionContent}
                      onChange={(e) => setEditedSectionContent(e.target.value)}
                      className="min-h-[400px] font-mono text-sm"
                      placeholder={'Enter competitive analysis in Markdown format...\\n\\nExample:\\n## Competitor A\\nDescription\\n\\n## Competitor B\\nDescription'}
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

        // Regular section rendering - get config for decorative card styling
        // Note: config may already be declared above for special sections
        const regularSectionConfig = getSectionConfig(section.title);
        
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
                background: regularSectionConfig?.gradient || '#3b82f6'
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
                stroke={(regularSectionConfig?.gradient?.includes('#ec4899') ? '#ec4899' : 
                       regularSectionConfig?.gradient?.includes('#8b5cf6') ? '#8b5cf6' :
                       regularSectionConfig?.gradient?.includes('#fbbf24') ? '#fbbf24' :
                       regularSectionConfig?.gradient?.includes('#10b981') ? '#10b981' : '#3b82f6')}
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
                  background: (regularSectionConfig?.gradient?.includes('#ec4899') ? '#ec4899' : 
                             regularSectionConfig?.gradient?.includes('#8b5cf6') ? '#8b5cf6' :
                             regularSectionConfig?.gradient?.includes('#fbbf24') ? '#fbbf24' :
                             regularSectionConfig?.gradient?.includes('#10b981') ? '#10b981' : '#3b82f6'),
                  boxShadow: `0 0 ${dot.size * 2}px ${regularSectionConfig?.gradient?.includes('#ec4899') ? '#ec489940' : 
                             regularSectionConfig?.gradient?.includes('#8b5cf6') ? '#8b5cf640' :
                             regularSectionConfig?.gradient?.includes('#fbbf24') ? '#fbbf2440' :
                             regularSectionConfig?.gradient?.includes('#10b981') ? '#10b98140' : '#3b82f640'}`,
                  animationDelay: `${dot.delay}s`,
                }}
              />
            ))}

            {/* Gradient glow on hover */}
            <motion.div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${
                  regularSectionConfig?.gradient?.includes('#ec4899') ? '#ec489920' : 
                  regularSectionConfig?.gradient?.includes('#8b5cf6') ? '#8b5cf620' :
                  regularSectionConfig?.gradient?.includes('#fbbf24') ? '#fbbf2420' :
                  regularSectionConfig?.gradient?.includes('#10b981') ? '#10b98120' : '#3b82f620'
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
