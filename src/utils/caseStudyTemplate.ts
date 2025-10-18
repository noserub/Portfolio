// Case Study Template based on MassRoots
// Empty sections will not appear in the live version - they only show in edit mode

export const CASE_STUDY_TEMPLATE = {
  title: "New Case Study",
  description: "Add your project description here",
  caseStudyContent: `# Overview

(Brief overview of the project - what it is, why it matters)

---

# The challenge

(Describe the problem you were solving - add multiple paragraphs or bullet points as needed)

---

# My role & impact

## Leadership
• Define strategy and vision
• Build and mentor team
• Collaborate with stakeholders

## Design
• Design end-to-end experience
• Create design system
• Prototype and test
• Build and ship features

## Research
• Conduct user research studies
• Analyze data and insights
• Validate design decisions
• Test prototypes with users

---

# Impact

⭐ **Key metric 1:** Description

👉 **Key metric 2:** Description

🔄 **Key metric 3:** Description

💵 **Key metric 4:** Description

---

# At a glance

**Platform:** (iOS, Android, Web, etc.)

**Role:** (Your role on the project)

**Timeline:** (Project duration and type)

**Team:** (Team size and structure)

---

# Research insights

## Insight 1 headline

Description of the insight and why it matters.

## Insight 2 headline

Description of the insight and why it matters.

## Insight 3 headline

Description of the insight and why it matters.

(Add or remove ## sections as needed - each becomes a card)

---

# Competitive analysis

## Competitor 1

Description of competitor and key differentiators
• Feature 1
• Feature 2
• Limitation

## Competitor 2

Description of competitor and key differentiators
• Feature 1
• Feature 2
• Limitation

(Add or remove ## competitor sections as needed - each becomes a card)

---

# The solution: A new direction

(Describe your solution approach, key features, and how they address the challenge)

---

# Key features

## Feature 1 headline

Description of this key feature and its impact on users.

## Feature 2 headline

Description of this key feature and its impact on users.

## Feature 3 headline

Description of this key feature and its impact on users.

(Add or remove ## sections as needed - each becomes a card)

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
