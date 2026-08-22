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
  return false;
}

export function isCardBasedCaseStudyTitle(title: string): boolean {
  const normalized = normalizeCaseStudySectionTitle(title);
  if (!normalized) return false;
  if (isExactTitleInList(title, CARD_SECTION_TITLES)) return true;
  if (normalized.startsWith("research insight")) return true;
  if (normalized.startsWith("key decision")) return true;
  return false;
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

function normalizeSectionBody(content: string): string {
  return content.replace(/\s+/g, " ").trim().toLowerCase();
}

function bodiesAreDuplicate(a: string, b: string): boolean {
  const left = normalizeSectionBody(a);
  const right = normalizeSectionBody(b);
  if (!left && !right) return true;
  if (!left || !right) return false;
  if (left === right) return true;
  const shorter = left.length <= right.length ? left : right;
  const longer = left.length > right.length ? left : right;
  return shorter.length >= 80 && longer.includes(shorter);
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
    if (currentSection) sections.push(currentSection);
    currentSection = null;
    skipImpactSubsection = false;
  };

  for (const line of lines) {
    const headerMatch = line.trim().match(/^#\s+(.+)$/);
    if (headerMatch && !/^#{2,}/.test(line.trim())) {
      const title = headerMatch[1].trim();
      if (
        currentSection &&
        isCardBasedCaseStudyTitle(currentSection.title) &&
        !isStructuralCaseStudyTitle(title)
      ) {
        currentSection.content += `## ${title}\n`;
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

/**
 * One Overview / Results / Research insights / etc. per page.
 * Later copies are dropped; the longest body wins.
 */
export function collapseDuplicateCaseStudySections(
  sections: CaseStudyParsedSection[],
): CaseStudyParsedSection[] {
  const kept: CaseStudyParsedSection[] = [];

  for (const section of sections) {
    const uniqueKey = uniqueSectionKey(section.title);
    const existingIndex = kept.findIndex((item) => {
      if (uniqueKey && uniqueSectionKey(item.title) === uniqueKey) return true;
      return caseStudySectionTitlesMatch(item.title, section.title);
    });

    if (existingIndex === -1) {
      kept.push(section);
      continue;
    }

    const existing = kept[existingIndex];
    const sameUnique = Boolean(uniqueKey);
    if (sameUnique || bodiesAreDuplicate(existing.content, section.content)) {
      const preferResearchTitle =
        normalizeCaseStudySectionTitle(existing.title).includes("research")
          ? existing.title
          : normalizeCaseStudySectionTitle(section.title).includes("research")
            ? section.title
            : existing.title;
      const nextTitle =
        uniqueKey === "research insights" ? preferResearchTitle : existing.title;

      let nextContent = existing.content;
      if (bodiesAreDuplicate(existing.content, section.content)) {
        if (section.content.trim().length > existing.content.trim().length) {
          nextContent = section.content;
        }
      } else if (uniqueKey === "research insights") {
        nextContent = `${existing.content.trim()}\n\n${section.content.trim()}\n`;
      } else if (section.content.trim().length > existing.content.trim().length) {
        nextContent = section.content;
      }

      kept[existingIndex] = { title: nextTitle, content: nextContent };
      continue;
    }

    kept.push(section);
  }

  return kept;
}
