/** Top-level case-study headings. Anything else after a card section stays a card. */
const STRUCTURAL_SECTION_TITLES = [
  "overview",
  "the challenge",
  "challenge",
  "my role & impact",
  "my role and impact",
  "my role",
  "key decisions",
  "decisions",
  "research insights",
  "research",
  "insights",
  "competitive analysis",
  "the solution",
  "key features",
  "project phases",
  "results",
  "looking ahead",
  "at a glance",
  "impact",
  "tech stack",
  "tools",
];

const CARD_SECTION_TITLES = [
  "research insights",
  "research",
  "key decisions",
  "decisions",
  "my role & impact",
  "my role and impact",
  "my role",
  "competitive analysis",
  "key features",
  "project phases",
];

export type CaseStudyParsedSection = { title: string; content: string };

export function normalizeCaseStudySectionTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isExactTitleInList(title: string, list: string[]): boolean {
  const normalized = normalizeCaseStudySectionTitle(title);
  return list.some((item) => normalizeCaseStudySectionTitle(item) === normalized);
}

export function isStructuralCaseStudyTitle(title: string): boolean {
  const normalized = normalizeCaseStudySectionTitle(title);
  if (!normalized) return false;
  if (isExactTitleInList(title, STRUCTURAL_SECTION_TITLES)) return true;
  if (normalized.startsWith("the solution") && !normalized.includes("card")) return true;
  if (normalized.startsWith("results ")) return true;
  if (normalized.startsWith("research insight")) return true;
  if (isResearchInsightsSectionTitle(title)) return true;
  return false;
}

/**
 * Turn leftover `#` / `##` labels into inline bold so Results stays paragraphs.
 * `## Bar` + the next sentence becomes `**Bar:** sentence`.
 */
export function flattenProseSectionHeadings(body: string): string {
  const lines = String(body || "").replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const heading = lines[i].match(/^#{1,6}\s+(.+)$/);
    if (!heading) {
      out.push(lines[i]);
      continue;
    }

    const label = heading[1].trim().replace(/:+\s*$/, "");
    if (!label) continue;

    let nextIndex = i + 1;
    while (nextIndex < lines.length && lines[nextIndex].trim() === "") {
      nextIndex += 1;
    }
    const nextLine = lines[nextIndex];
    const nextIsHeading = Boolean(nextLine && /^#{1,6}\s+/.test(nextLine));

    if (nextLine && !nextIsHeading) {
      const rest = nextLine.trim();
      const restHasLabel = rest.toLowerCase().startsWith(label.toLowerCase());
      out.push(restHasLabel ? rest : `**${label}:** ${rest}`);
      i = nextIndex;
      continue;
    }

    out.push(`**${label}:**`);
  }

  return out.join("\n");
}

/** Prose chapters. Inner `# Bar` lines stay in the section instead of becoming new pages. */
export function isProseCaseStudyTitle(title: string): boolean {
  const normalized = normalizeCaseStudySectionTitle(title);
  if (!normalized) return false;
  if (normalized === "overview") return true;
  if (normalized === "the challenge" || normalized === "challenge") return true;
  if (normalized.startsWith("the solution") && !normalized.includes("card")) return true;
  if (normalized === "results" || normalized.startsWith("results ")) return true;
  if (normalized === "looking ahead") return true;
  return false;
}

export function isCardBasedCaseStudyTitle(title: string): boolean {
  const normalized = normalizeCaseStudySectionTitle(title);
  if (!normalized) return false;
  if (isExactTitleInList(title, CARD_SECTION_TITLES)) return true;
  if (normalized.startsWith("research insight")) return true;
  if (normalized.startsWith("key decision")) return true;
  if (isResearchInsightsSectionTitle(title)) return true;
  return false;
}

export function splitCardSectionLeadIn(content: string): { leadIn: string; cardsSource: string } {
  const text = String(content || "");
  const match = text.match(/\n(?=##+\s+\S)/);
  if (match && match.index !== undefined) {
    return {
      leadIn: text.slice(0, match.index).trim(),
      cardsSource: text.slice(match.index).trim(),
    };
  }
  if (/^##+\s+\S/.test(text.trim())) {
    return { leadIn: "", cardsSource: text.trim() };
  }
  return { leadIn: text.trim(), cardsSource: "" };
}

export function isResearchInsightsSectionTitle(title: string): boolean {
  const normalized = normalizeCaseStudySectionTitle(title);
  if (!normalized) return false;
  if (normalized.includes("how the evaluation lab works")) return false;
  if (normalized.includes("research")) return true;
  if (normalized.includes("insight")) return true;
  if (normalized === "evaluation lab") return true;
  return false;
}

export function sameCaseStudySection(a: string, b: string): boolean {
  if (caseStudySectionTitlesMatch(a, b)) return true;
  const leftKey = uniqueSectionKey(a);
  const rightKey = uniqueSectionKey(b);
  return Boolean(leftKey && rightKey && leftKey === rightKey);
}

export function caseStudySectionTitlesMatch(a: string, b: string): boolean {
  const left = normalizeCaseStudySectionTitle(a);
  const right = normalizeCaseStudySectionTitle(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const resultLeft = left === "results" || left.startsWith("results ");
  const resultRight = right === "results" || right.startsWith("results ");
  return resultLeft && resultRight;
}

function uniqueSectionKey(title: string): string | null {
  const normalized = normalizeCaseStudySectionTitle(title);
  if (!normalized) return null;
  if (normalized === "overview") return "overview";
  if (normalized === "the challenge" || normalized === "challenge") return "challenge";
  if (normalized.includes("my role")) return "my role";
  if (normalized.includes("key decision") || normalized === "decisions") return "key decisions";
  if (isResearchInsightsSectionTitle(title)) return "research insights";
  if (normalized.includes("competitive")) return "competitive analysis";
  if (normalized.startsWith("the solution") && !normalized.includes("card")) return "the solution";
  if (normalized === "results" || normalized.startsWith("results ")) return "results";
  return null;
}

/**
 * Split markdown on top-level `#` headings.
 * H1s inside a card section that are not structural titles stay in that section as `##`.
 */
export function parseCaseStudySections(markdown: string): CaseStudyParsedSection[] {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  const sections: CaseStudyParsedSection[] = [];
  let currentSection: CaseStudyParsedSection | null = null;
  let skipImpactSubsection = false;

  const flush = () => {
    if (currentSection) {
      if (isProseCaseStudyTitle(currentSection.title)) {
        currentSection.content = flattenProseSectionHeadings(currentSection.content);
      }
      sections.push(currentSection);
    }
    currentSection = null;
    skipImpactSubsection = false;
  };

  for (const line of lines) {
    const headerMatch = line.trim().match(/^#\s+(.+)$/);
    if (headerMatch && !/^#{2,}/.test(line.trim())) {
      const title = headerMatch[1].trim();
      if (
        currentSection &&
        !isStructuralCaseStudyTitle(title) &&
        (isCardBasedCaseStudyTitle(currentSection.title) ||
          isProseCaseStudyTitle(currentSection.title))
      ) {
        currentSection.content += isProseCaseStudyTitle(currentSection.title)
          ? `${line}\n`
          : `## ${title}\n`;
        skipImpactSubsection = false;
        continue;
      }
      flush();
      currentSection = { title, content: "" };
      continue;
    }

    if (!currentSection) continue;

    if (line.trim() === "## Impact" && currentSection.title === "Impact") {
      skipImpactSubsection = true;
      continue;
    }
    if (line.trim().startsWith("## ") && skipImpactSubsection) {
      skipImpactSubsection = false;
    }
    if (!skipImpactSubsection) {
      currentSection.content += `${line}\n`;
    }
  }

  flush();
  return sections;
}

/** Body of one H1 as stored, without display rewrites. */
export function extractRawSectionBody(
  markdown: string,
  sectionTitle: string,
): string | null {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  let currentTitle: string | null = null;
  let currentBody: string[] = [];
  let found: string | null = null;

  const take = () => {
    if (
      found === null &&
      currentTitle &&
      sameCaseStudySection(currentTitle, sectionTitle)
    ) {
      found = currentBody.join("\n");
    }
    currentTitle = null;
    currentBody = [];
  };

  for (const line of lines) {
    const headerMatch = line.trim().match(/^#\s+(.+)$/);
    if (headerMatch && !/^#{2,}/.test(line.trim())) {
      const title = headerMatch[1].trim();
      if (
        currentTitle &&
        !isStructuralCaseStudyTitle(title) &&
        (isCardBasedCaseStudyTitle(currentTitle) || isProseCaseStudyTitle(currentTitle))
      ) {
        currentBody.push(line);
        continue;
      }
      take();
      currentTitle = title;
      continue;
    }
    if (currentTitle) currentBody.push(line);
  }
  take();
  return found;
}

/** One Overview / Results / The solution / etc. The first copy wins. Later copies are dropped. */
export function collapseDuplicateCaseStudySections(
  sections: CaseStudyParsedSection[],
): CaseStudyParsedSection[] {
  const kept: CaseStudyParsedSection[] = [];

  for (const section of sections) {
    const alreadyKept = kept.some((item) => sameCaseStudySection(item.title, section.title));
    if (!alreadyKept) kept.push(section);
  }

  return kept;
}
