// Flexible Case Study Template System
// Allows users to add, remove, and reorder any case study elements

export interface CaseStudySection {
  id: string;
  title: string;
  content: string;
  type: 'markdown' | 'images' | 'videos' | 'flowDiagrams' | 'solutionCards';
  position: number;
  isVisible: boolean;
}

export interface FlexibleCaseStudyTemplate {
  title: string;
  description: string;
  sections: CaseStudySection[];
  metadata: {
    projectImagesPosition: number;
    videosPosition: number;
    flowDiagramsPosition: number;
    solutionCardsPosition: number;
  };
}

// Available section templates that users can add
export const AVAILABLE_SECTIONS: Array<{
  id: string;
  title: string;
  content: string;
  type: 'markdown' | 'images' | 'videos' | 'flowDiagrams' | 'solutionCards';
  description: string;
  icon: string;
}> = [
  {
    id: 'overview',
    title: 'Overview',
    content: 'Brief overview of the project - what it is, why it matters, and the key outcomes achieved.',
    type: 'markdown',
    description: 'Project summary and key outcomes',
    icon: '📋'
  },
  {
    id: 'at-a-glance',
    title: 'At a glance',
    content: `**Platform:** (iOS, Android, Web, etc.)

**Role:** (Your role on the project)

**Timeline:** (Project duration and type)

**Team:** (Team size and structure)`,
    type: 'markdown',
    description: 'Project metadata and key details',
    icon: '👁️'
  },
  {
    id: 'impact',
    title: 'Impact',
    content: `⭐ **Key metric 1:** Description of the impact and results achieved

👉 **Key metric 2:** Description of the impact and results achieved

🔄 **Key metric 3:** Description of the impact and results achieved

💵 **Key metric 4:** Description of the impact and results achieved`,
    type: 'markdown',
    description: 'Key metrics and business impact',
    icon: '📊'
  },
  {
    id: 'my-role-impact',
    title: 'My role & impact',
    content: `## Leadership
• Define strategy and vision for the project
• Build and mentor team members
• Collaborate with stakeholders to align on goals

## Design
• Design end-to-end user experience
• Create intuitive interface and interactions
• Prototype and test with real users
• Build and ship features that drive results

## Research
• Conduct user research studies with target audience
• Analyze data and insights to inform decisions
• Validate design decisions through usability testing
• Test prototypes with users to ensure success`,
    type: 'markdown',
    description: 'Your role and contributions',
    icon: '👤'
  },
  {
    id: 'research-insights',
    title: 'Research insights',
    content: `## Key insight 1

Description of this important research finding and why it matters for the project.

## Key insight 2

Description of this important research finding and why it matters for the project.

## Key insight 3

Description of this important research finding and why it matters for the project.

(Add or remove ## sections as needed - each becomes a card)`,
    type: 'markdown',
    description: 'User research findings and insights',
    icon: '🔍'
  },
  {
    id: 'competitive-analysis',
    title: 'Competitive analysis',
    content: `## Competitor 1

Description of this competitor and their key differentiators
• Key strength 1
• Key strength 2
• Main limitation

## Competitor 2

Description of this competitor and their key differentiators
• Key strength 1
• Key strength 2
• Main limitation

(Add or remove ## competitor sections as needed - each becomes a card)`,
    type: 'markdown',
    description: 'Competitor analysis and market positioning',
    icon: '🏆'
  },
  {
    id: 'the-solution',
    title: 'The solution: A new direction',
    content: 'Describe your solution approach, key features, and how they address the challenge. Explain the strategy and methodology behind your approach.',
    type: 'markdown',
    description: 'Solution approach and methodology',
    icon: '💡'
  },
  {
    id: 'key-features',
    title: 'Key features',
    content: `## Feature 1 headline

Description of this key feature and its impact on users and the business.

## Feature 2 headline

Description of this key feature and its impact on users and the business.

## Feature 3 headline

Description of this key feature and its impact on users and the business.

(Add or remove ## sections as needed - each becomes a card)`,
    type: 'markdown',
    description: 'Key product features and functionality',
    icon: '⚡'
  },
  {
    id: 'the-challenge',
    title: 'The challenge',
    content: 'Describe the problem you were solving - add multiple paragraphs or bullet points as needed to fully explain the context and constraints.',
    type: 'markdown',
    description: 'Problem statement and context',
    icon: '🎯'
  },
  {
    id: 'project-images',
    title: 'Project Images',
    content: '',
    type: 'images',
    description: 'Gallery of project screenshots and visuals',
    icon: '🖼️'
  },
  {
    id: 'videos',
    title: 'Videos',
    content: '',
    type: 'videos',
    description: 'Video demonstrations and walkthroughs',
    icon: '🎥'
  },
  {
    id: 'flow-diagrams',
    title: 'Flow Diagrams',
    content: '',
    type: 'flowDiagrams',
    description: 'User flow diagrams and process maps',
    icon: '📊'
  },
  {
    id: 'solution-cards',
    title: 'Solution Cards',
    content: '',
    type: 'solutionCards',
    description: 'Interactive solution showcase cards',
    icon: '🎴'
  }
];

// Create a blank case study with no sections
export function createBlankCaseStudy(): FlexibleCaseStudyTemplate {
  return {
    title: "New Case Study",
    description: "Add your project description here",
    sections: [],
    metadata: {
      projectImagesPosition: 2,
      videosPosition: 998,
      flowDiagramsPosition: 1000,
      solutionCardsPosition: 999
    }
  };
}

// Add a section to a case study
export function addSectionToCaseStudy(
  caseStudy: FlexibleCaseStudyTemplate,
  sectionId: string
): FlexibleCaseStudyTemplate {
  const sectionTemplate = AVAILABLE_SECTIONS.find(s => s.id === sectionId);
  if (!sectionTemplate) {
    console.error(`Section template not found: ${sectionId}`);
    return caseStudy;
  }

  const newSection: CaseStudySection = {
    id: `${sectionId}-${Date.now()}`,
    title: sectionTemplate.title,
    content: sectionTemplate.content,
    type: sectionTemplate.type,
    position: caseStudy.sections.length,
    isVisible: true
  };

  return {
    ...caseStudy,
    sections: [...caseStudy.sections, newSection]
  };
}

// Remove a section from a case study
export function removeSectionFromCaseStudy(
  caseStudy: FlexibleCaseStudyTemplate,
  sectionId: string
): FlexibleCaseStudyTemplate {
  return {
    ...caseStudy,
    sections: caseStudy.sections.filter(s => s.id !== sectionId)
  };
}

// Reorder sections in a case study
export function reorderCaseStudySections(
  caseStudy: FlexibleCaseStudyTemplate,
  fromIndex: number,
  toIndex: number
): FlexibleCaseStudyTemplate {
  const newSections = [...caseStudy.sections];
  const [movedSection] = newSections.splice(fromIndex, 1);
  newSections.splice(toIndex, 0, movedSection);

  // Update positions
  const updatedSections = newSections.map((section, index) => ({
    ...section,
    position: index
  }));

  return {
    ...caseStudy,
    sections: updatedSections
  };
}

// Convert flexible case study to markdown content
export function convertToMarkdownContent(caseStudy: FlexibleCaseStudyTemplate): string {
  const markdownSections = caseStudy.sections
    .filter(section => section.type === 'markdown' && section.isVisible)
    .sort((a, b) => a.position - b.position);

  return markdownSections
    .map(section => `# ${section.title}\n\n${section.content}`)
    .join('\n\n---\n\n');
}

// Convert flexible case study to legacy format for Supabase
export function convertToLegacyFormat(caseStudy: FlexibleCaseStudyTemplate): any {
  const markdownContent = convertToMarkdownContent(caseStudy);
  
  // Find positions of special sections
  const projectImagesSection = caseStudy.sections.find(s => s.type === 'images');
  const videosSection = caseStudy.sections.find(s => s.type === 'videos');
  const flowDiagramsSection = caseStudy.sections.find(s => s.type === 'flowDiagrams');
  const solutionCardsSection = caseStudy.sections.find(s => s.type === 'solutionCards');

  return {
    id: `cs-${Math.random().toString(36).substr(2, 9)}`,
    title: caseStudy.title,
    description: caseStudy.description,
    url: "",
    position: { x: 50, y: 50 },
    scale: 1,
    published: false,
    caseStudyContent: markdownContent,
    projectImagesPosition: projectImagesSection ? projectImagesSection.position : caseStudy.metadata.projectImagesPosition,
    videosPosition: videosSection ? videosSection.position : caseStudy.metadata.videosPosition,
    flowDiagramsPosition: flowDiagramsSection ? flowDiagramsSection.position : caseStudy.metadata.flowDiagramsPosition,
    solutionCardsPosition: solutionCardsSection ? solutionCardsSection.position : caseStudy.metadata.solutionCardsPosition,
    caseStudyImages: [],
    flowDiagramImages: [],
    videoItems: []
  };
}
