// Case Study Template based on MassRoots
// Empty sections will not appear in the live version - they only show in edit mode

export const CASE_STUDY_TEMPLATE = {
  title: "New Case Study",
  description: "Add your project description here",
  caseStudyContent: `# Overview

Brief overview of the project - what it is, why it matters, and the key outcomes achieved.

---

# At a glance

**Platform:** (iOS, Android, Web, etc.)

**Role:** (Your role on the project)

**Timeline:** (Project duration and type)

**Team:** (Team size and structure)

---

# Impact

⭐ **Key metric 1:** Description of the impact and results achieved

👉 **Key metric 2:** Description of the impact and results achieved

🔄 **Key metric 3:** Description of the impact and results achieved

💵 **Key metric 4:** Description of the impact and results achieved

---

# My role & impact

## Leadership
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
• Test prototypes with users to ensure success

---

# Research insights

## Key insight 1

Description of this important research finding and why it matters for the project.

## Key insight 2

Description of this important research finding and why it matters for the project.

## Key insight 3

Description of this important research finding and why it matters for the project.

(Add or remove ## sections as needed - each becomes a card)

---

# Competitive analysis

## Competitor 1

Description of this competitor and their key differentiators
• Key strength 1
• Key strength 2
• Main limitation

## Competitor 2

Description of this competitor and their key differentiators
• Key strength 1
• Key strength 2
• Main limitation

(Add or remove ## competitor sections as needed - each becomes a card)

---

# The solution: A new direction

Describe your solution approach, key features, and how they address the challenge. Explain the strategy and methodology behind your approach.

---

# Key features

## Feature 1 headline

Description of this key feature and its impact on users and the business.

## Feature 2 headline

Description of this key feature and its impact on users and the business.

## Feature 3 headline

Description of this key feature and its impact on users and the business.

(Add or remove ## sections as needed - each becomes a card)

---

# The challenge

Describe the problem you were solving - add multiple paragraphs or bullet points as needed to fully explain the context and constraints.

---

(📌 Solution Cards and Flow Diagrams will appear here automatically after "Key features" section)
`
};

// Helper to create a new case study from template with unique ID
export function createCaseStudyFromTemplate(): any {
  return {
    id: `cs-${Math.random().toString(36).substr(2, 9)}`,
    url: "", // No hero image by default
    ...CASE_STUDY_TEMPLATE,
    position: { x: 50, y: 50 },
    scale: 1,
    published: false,
    // Section positions following MassRoots layout
    projectImagesPosition: 2,        // After Overview
    solutionCardsPosition: 999,      // After all markdown sections (before Flow Diagrams)
    flowDiagramsPosition: 1000,      // At the very end
    // Gallery settings
    galleryAspectRatio: "3x4",       // Portrait by default
    flowDiagramAspectRatio: "16x9",  // Widescreen by default
    galleryColumns: 3,
    flowDiagramColumns: 2,
    // Start with empty arrays - no placeholder images to avoid blob URL errors
    caseStudyImages: [],
    flowDiagramImages: []
  };
}
