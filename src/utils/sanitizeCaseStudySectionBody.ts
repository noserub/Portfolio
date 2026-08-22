import {
  flattenProseSectionHeadings,
  isProseCaseStudyTitle,
} from "../lib/parseCaseStudySections";

/**
 * Keep pasted markdown inside one case-study section.
 * Prose sections (Results, Overview, Solution) stay paragraphs.
 * Card sections still promote leftover H1s to ## so cards keep working.
 */
export function sanitizeCaseStudySectionBody(body: string, sectionTitle: string): string {
  if (!body) return body;

  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const title = sectionTitle.trim().toLowerCase();
  let start = 0;

  while (start < lines.length && lines[start].trim() === "") {
    start += 1;
  }

  const firstHeader = lines[start]?.trim().match(/^#{1,2}\s+(.+)$/);
  if (firstHeader && firstHeader[1].trim().toLowerCase() === title) {
    start += 1;
    while (start < lines.length && lines[start].trim() === "") {
      start += 1;
    }
  }

  const stripped = lines
    .slice(start)
    .map((line) => {
      const heading = line.match(/^(#{1,2})\s+(.+)$/);
      if (heading && heading[2].trim().toLowerCase() === title) return "";
      return line;
    })
    .join("\n");

  if (isProseCaseStudyTitle(sectionTitle)) {
    return flattenProseSectionHeadings(stripped);
  }

  return stripped
    .split("\n")
    .map((line) => {
      if (/^#\s+/.test(line) && !/^#{2,}/.test(line.trim())) {
        return line.replace(/^#\s+/, "## ");
      }
      return line;
    })
    .join("\n");
}
