/** Modern About page copy (Highlights section). */
export const MODERN_ABOUT_HIGHLIGHTS = [
  {
    title: "Awards & Patents",
    text: "9 U.S. patents and 2 Medical Device Excellence Awards for the t:slim insulin pump — recognition for innovation in regulated, safety-critical product design.",
  },
  {
    title: "Product Launches",
    text: "Led 0→1 launches including Skype for Android Tablet, Skype Qik, and the t:slim insulin pump — from concept through production across consumer, mobile, and medical contexts.",
  },
  {
    title: "Enterprise AI",
    text: "Currently leading design for enterprise AI experiences at Oracle: RAG, MCP, conversational UX, and search at scale.",
  },
] as const;

export const MODERN_ABOUT_PROCESS = {
  title: "How I work",
  subheading:
    "My process adapts to each project. The through-line is learn before commitment, stay close through build, measure after launch.",
  steps: [
    {
      num: "01",
      phase: "Discover",
      title: "Seek clarity",
      description:
        "Understand the real workflow, constraints, and what would count as success before design work spreads.",
    },
    {
      num: "02",
      phase: "Frame",
      title: "Set direction",
      description:
        "Align executives, product, and engineering on one bet: permissions, failure modes, and patterns the team can actually build.",
    },
    {
      num: "03",
      phase: "Prototype",
      title: "Design & Build",
      description:
        "Research, prototypes in code, and eval checks when stakes are high. Reduce the cost of being wrong before engineering commits.",
    },
    {
      num: "04",
      phase: "Learn",
      title: "Ship and measure",
      description:
        "Stay close through implementation and launch readiness. Track adoption and failure modes after release, then fix what production proved.",
    },
  ],
} as const;
